from copy import deepcopy

from lxml import etree
import dateutil.parser

NAMESPACES = {
    'ns': 'http://www.garmin.com/xmlschemas/TrainingCenterDatabase/v2',
    'ns3': 'http://www.garmin.com/xmlschemas/ActivityExtension/v2'
}


def _parse_lap_elements(laps_elements):
    """Lap XML 요소 목록에서 랩 데이터를 추출한다."""
    laps_data = []
    for i, lap in enumerate(laps_elements):
        lap_time = float(lap.xpath('ns:TotalTimeSeconds', namespaces=NAMESPACES)[0].text)
        lap_dist = float(lap.xpath('ns:DistanceMeters', namespaces=NAMESPACES)[0].text)

        avg_hr_elem = lap.xpath('ns:AverageHeartRateBpm/ns:Value', namespaces=NAMESPACES)
        avg_hr = float(avg_hr_elem[0].text) if avg_hr_elem else None

        max_hr_elem = lap.xpath('ns:MaximumHeartRateBpm/ns:Value', namespaces=NAMESPACES)
        max_hr = float(max_hr_elem[0].text) if max_hr_elem else None

        avg_cadence = None
        cadence_elem = lap.xpath('ns:Cadence', namespaces=NAMESPACES)
        if cadence_elem:
            avg_cadence = float(cadence_elem[0].text)
        else:
            lx = lap.xpath('ns:Extensions/ns3:LX/ns3:AvgRunCadence', namespaces=NAMESPACES)
            if lx:
                avg_cadence = float(lx[0].text)

        pace = (lap_time / (lap_dist / 1000)) if lap_dist > 0 else 0

        laps_data.append({
            "lap_number": i + 1,
            "time": lap_time,
            "distance": lap_dist,
            "pace": pace,
            "avg_hr": avg_hr,
            "max_hr": max_hr,
            "avg_cadence": avg_cadence,
        })

    return laps_data


def parse_tcx(file_content):
    """원본 TCX를 파싱하여 활동 요약 + 랩 데이터를 반환한다."""
    tree = etree.fromstring(file_content)
    activities = tree.xpath('//ns:Activity', namespaces=NAMESPACES)

    parsed_data = []

    for activity in activities:
        start_time_elem = activity.find('ns:Id', namespaces=NAMESPACES)
        start_time_str = start_time_elem.text if start_time_elem is not None else None
        if not start_time_str:
            continue
        start_time = dateutil.parser.parse(start_time_str)

        laps = activity.xpath('ns:Lap', namespaces=NAMESPACES)
        laps_data = _parse_lap_elements(laps)

        total_time = sum(l['time'] for l in laps_data)
        total_distance = sum(l['distance'] for l in laps_data)
        avg_pace = (total_time / (total_distance / 1000)) if total_distance > 0 else 0

        valid_hrs = [l['avg_hr'] for l in laps_data if l['avg_hr'] is not None]
        activity_avg_hr = sum(valid_hrs) / len(valid_hrs) if valid_hrs else None

        valid_cadence = [l['avg_cadence'] for l in laps_data if l['avg_cadence'] is not None]
        activity_avg_cadence = sum(valid_cadence) / len(valid_cadence) if valid_cadence else None

        parsed_data.append({
            "start_time": start_time,
            "total_time": total_time,
            "total_distance": total_distance,
            "avg_pace": avg_pace,
            "avg_hr": activity_avg_hr,
            "avg_cadence": activity_avg_cadence,
            "laps": laps_data,
        })

    return parsed_data


def detect_treadmill(file_content: bytes) -> bool:
    """TCX에 GPS 좌표(Position)가 없으면 트레드밀로 판단한다."""
    tree = etree.fromstring(file_content)
    positions = tree.xpath('//ns:Trackpoint/ns:Position', namespaces=NAMESPACES)
    return len(positions) == 0


def create_lightweight_tcx(file_content: bytes) -> str:
    """원본 TCX에서 경량 TCX를 생성한다.

    - Lap 요약 태그 유지
    - Trackpoint는 1분 간격으로 샘플링
    - Position, Watts 태그 제거
    - 인라인 네임스페이스 선언을 루트로 통합
    """
    tree = etree.fromstring(file_content)

    for activity in tree.xpath('//ns:Activity', namespaces=NAMESPACES):
        for lap in activity.xpath('ns:Lap', namespaces=NAMESPACES):
            for track in lap.xpath('ns:Track', namespaces=NAMESPACES):
                trackpoints = track.xpath('ns:Trackpoint', namespaces=NAMESPACES)
                if not trackpoints:
                    continue

                # 첫 Trackpoint의 시간을 기준으로 1분 간격 샘플링
                first_time_elem = trackpoints[0].find('ns:Time', namespaces=NAMESPACES)
                if first_time_elem is None:
                    continue
                base_time = dateutil.parser.parse(first_time_elem.text)
                last_kept_time = base_time

                to_remove = []
                for j, tp in enumerate(trackpoints):
                    if j == 0:
                        # 첫 포인트는 항상 유지
                        pass
                    else:
                        time_elem = tp.find('ns:Time', namespaces=NAMESPACES)
                        if time_elem is None:
                            to_remove.append(tp)
                            continue
                        tp_time = dateutil.parser.parse(time_elem.text)
                        if (tp_time - last_kept_time).total_seconds() < 60:
                            to_remove.append(tp)
                            continue
                        last_kept_time = tp_time

                    # 유지되는 Trackpoint에서 Position, Watts 제거
                    for pos in tp.xpath('ns:Position', namespaces=NAMESPACES):
                        tp.remove(pos)
                    for watts in tp.xpath('.//ns3:Watts', namespaces=NAMESPACES):
                        watts.getparent().remove(watts)

                # 불필요한 Trackpoint 제거
                for tp in to_remove:
                    track.remove(tp)

    # 인라인 ns3 네임스페이스 선언 정리 — 루트에만 유지
    result = etree.tostring(tree, encoding='unicode')

    return result


def parse_laps_from_tcx(tcx_data: str) -> list[dict]:
    """저장된 경량 TCX 문자열에서 랩 데이터를 재파싱한다."""
    if not tcx_data:
        return []
    tree = etree.fromstring(tcx_data.encode('utf-8'))
    activities = tree.xpath('//ns:Activity', namespaces=NAMESPACES)
    if not activities:
        return []

    laps = activities[0].xpath('ns:Lap', namespaces=NAMESPACES)
    return _parse_lap_elements(laps)
