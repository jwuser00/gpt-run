#!/bin/bash
# OCI ARM 인스턴스 용량 부족 시 자동 재시도 스크립트
# 성공한 인스턴스는 results.md에 기록
# Usage: ./retry-apply.sh [interval_seconds] [max_attempts]

INTERVAL=${1:-300}    # 기본 5분 간격
MAX_ATTEMPTS=${2:-100} # 기본 최대 100회 (약 8시간)
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
LOG_FILE="${SCRIPT_DIR}/retry-apply.log"
RESULTS_FILE="${SCRIPT_DIR}/results.md"

cd "$SCRIPT_DIR" || exit 1

# 결과 파일 초기화 (없을 때만)
if [ ! -f "$RESULTS_FILE" ]; then
    cat > "$RESULTS_FILE" << 'HEADER'
# OCI Instance 확보 결과

시도 시작: -
마지막 업데이트: -

## 확보된 인스턴스

(아직 없음)

## 미확보

- small-1 (1 OCPU / 6GB)
- small-2 (1 OCPU / 6GB)
- medium (2 OCPU / 12GB)
HEADER
fi

# 시작 시간 기록
sed -i '' "s/시도 시작: .*/시도 시작: $(date '+%Y-%m-%d %H:%M:%S')/" "$RESULTS_FILE"

echo "=== OCI ARM Instance Retry Started ===" | tee "$LOG_FILE"
echo "Targets: small-1(1/6), small-2(1/6), medium(2/12)" | tee -a "$LOG_FILE"
echo "Interval: ${INTERVAL}s | Max: ${MAX_ATTEMPTS}" | tee -a "$LOG_FILE"
echo "Results: ${RESULTS_FILE}" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

check_and_record() {
    local now
    now=$(date '+%Y-%m-%d %H:%M:%S')

    # terraform state에서 생성된 인스턴스 확인
    local created
    created=$(terraform state list 2>/dev/null | grep 'oci_core_instance.server\[' | sed 's/.*\["\(.*\)"\]/\1/')

    if [ -z "$created" ]; then
        return 1
    fi

    # 결과 파일 업데이트
    local results_body="## 확보된 인스턴스\n"
    local pending=""
    local all_done=true

    for name in small-1 small-2 medium; do
        if echo "$created" | grep -q "^${name}$"; then
            local ip
            ip=$(terraform output -json instances 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('${name}',{}).get('public_ip','unknown'))" 2>/dev/null)
            local ocpus mem
            case $name in
                small-*) ocpus=1; mem=6 ;;
                medium)  ocpus=2; mem=12 ;;
            esac
            results_body+="- **${name}** (${ocpus} OCPU / ${mem}GB) — IP: \`${ip}\`\n"
            results_body+="  - SSH: \`ssh -i ~/.ssh/oci_arm ubuntu@${ip}\`\n"
        else
            all_done=false
            case $name in
                small-*) pending+="- ${name} (1 OCPU / 6GB)\n" ;;
                medium)  pending+="- ${name} (2 OCPU / 12GB)\n" ;;
            esac
        fi
    done

    if [ -n "$pending" ]; then
        results_body+="\n## 미확보\n\n${pending}"
    fi

    # 결과 파일 재작성
    cat > "$RESULTS_FILE" << EOF
# OCI Instance 확보 결과

시도 시작: $(grep '시도 시작:' "$RESULTS_FILE" 2>/dev/null | head -1 | sed 's/시도 시작: //' || echo "$now")
마지막 업데이트: ${now}

$(echo -e "$results_body")
EOF

    if $all_done; then
        return 0
    fi
    return 1
}

for i in $(seq 1 "$MAX_ATTEMPTS"); do
    echo "[Attempt $i/$MAX_ATTEMPTS] $(date '+%Y-%m-%d %H:%M:%S')" | tee -a "$LOG_FILE"

    terraform apply -auto-approve 2>&1 | tee -a "$LOG_FILE"

    # 결과 확인 및 기록
    if check_and_record; then
        echo "" | tee -a "$LOG_FILE"
        echo "=== ALL 3 INSTANCES CREATED at attempt $i ===" | tee -a "$LOG_FILE"
        terraform output 2>&1 | tee -a "$LOG_FILE"
        osascript -e 'display notification "All 3 OCI ARM instances created!" with title "Terraform" sound name "Glass"' 2>/dev/null
        exit 0
    fi

    # 일부라도 생성되면 알림
    local_created=$(terraform state list 2>/dev/null | grep -c 'oci_core_instance.server\[')
    if [ "$local_created" -gt 0 ]; then
        echo "  -> ${local_created}/3 instances created so far" | tee -a "$LOG_FILE"
        osascript -e "display notification \"${local_created}/3 instances secured\" with title \"Terraform\" sound name \"Ping\"" 2>/dev/null
    fi

    if [ "$i" -lt "$MAX_ATTEMPTS" ]; then
        echo "  -> Retrying in ${INTERVAL}s..." | tee -a "$LOG_FILE"
        echo "" | tee -a "$LOG_FILE"
        sleep "$INTERVAL"
    fi
done

echo "=== EXHAUSTED after $MAX_ATTEMPTS attempts ===" | tee -a "$LOG_FILE"
check_and_record
osascript -e 'display notification "Retry exhausted" with title "Terraform" sound name "Basso"' 2>/dev/null
exit 1
