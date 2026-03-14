"use client";

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import { Lap } from "@/lib/types";
import { formatTime, formatPace } from "@/lib/utils/format";

interface LapTableProps {
  laps: Lap[];
}

export default function LapTable({ laps }: LapTableProps) {
  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell>Lap</TableCell>
            <TableCell>Distance</TableCell>
            <TableCell>Time</TableCell>
            <TableCell>Pace</TableCell>
            <TableCell>Avg HR</TableCell>
            <TableCell>Max HR</TableCell>
            <TableCell>Cadence</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {laps.map((lap) => (
            <TableRow key={lap.lap_number} hover>
              <TableCell>{lap.lap_number}</TableCell>
              <TableCell>{(lap.distance / 1000).toFixed(2)} km</TableCell>
              <TableCell>{formatTime(lap.time)}</TableCell>
              <TableCell>{formatPace(lap.pace)} /km</TableCell>
              <TableCell>
                {lap.avg_hr ? Math.round(lap.avg_hr) : "-"}
              </TableCell>
              <TableCell>
                {lap.max_hr ? Math.round(lap.max_hr) : "-"}
              </TableCell>
              <TableCell>
                {lap.avg_cadence ? Math.round(lap.avg_cadence) : "-"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
