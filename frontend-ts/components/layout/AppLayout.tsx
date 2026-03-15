"use client";

import { usePathname, useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import DashboardIcon from "@mui/icons-material/Dashboard";
import DirectionsRunIcon from "@mui/icons-material/DirectionsRun";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PersonIcon from "@mui/icons-material/Person";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "@/lib/hooks/useAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AuthErrorModal from "@/components/auth/AuthErrorModal";

const DRAWER_WIDTH = 240;

const menuItems = [
  { label: "대시보드", icon: <DashboardIcon />, path: "/dashboard", exact: true },
  { label: "내 활동", icon: <DirectionsRunIcon />, path: "/activities", exact: false },
  { label: "대회 관리", icon: <EmojiEventsIcon />, path: "/races", exact: false },
  { label: "러닝 계획", icon: <CalendarMonthIcon />, path: "/plans", exact: false },
  { label: "내 정보", icon: <PersonIcon />, path: "/profile", exact: false },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    router.replace("/login");
  };

  return (
    <ProtectedRoute>
      <Box sx={{ display: "flex", minHeight: "100vh" }}>
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: DRAWER_WIDTH,
              boxSizing: "border-box",
              background: "linear-gradient(180deg, #4e73df 10%, #224abe 100%)",
              color: "rgba(255,255,255,0.8)",
              border: "none",
            },
          }}
        >
          <Box sx={{ p: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: "50%",
                bgcolor: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 800,
                fontSize: "0.9rem",
                color: "#fff",
              }}
            >
              RM
            </Box>
            <Box>
              <Typography
                variant="subtitle2"
                sx={{ color: "#fff", fontWeight: 700 }}
              >
                Running Manager
              </Typography>
              <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.5)" }}>
                Next.js + MUI
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ borderColor: "rgba(255,255,255,0.15)", mx: 1 }} />

          <List sx={{ px: 1, mt: 1 }}>
            {menuItems.map((item) => (
              <ListItemButton
                key={item.label}
                selected={item.exact ? pathname === item.path : pathname.startsWith(item.path)}
                onClick={() => router.push(item.path)}
                sx={{
                  borderRadius: 1,
                  mb: 0.5,
                  "&.Mui-selected": {
                    bgcolor: "rgba(255,255,255,0.15)",
                    "&:hover": { bgcolor: "rgba(255,255,255,0.2)" },
                  },
                  "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
                }}
              >
                <ListItemIcon sx={{ color: "rgba(255,255,255,0.8)", minWidth: 36 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontSize: "0.875rem", fontWeight: 600 }}
                />
              </ListItemButton>
            ))}
          </List>

          <Box sx={{ mt: "auto", p: 2 }}>
            <Button
              fullWidth
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              sx={{
                color: "rgba(255,255,255,0.8)",
                justifyContent: "flex-start",
                textTransform: "none",
                "&:hover": { bgcolor: "rgba(255,255,255,0.1)" },
              }}
            >
              로그아웃
            </Button>
          </Box>
        </Drawer>

        <Box
          component="main"
          sx={{
            flexGrow: 1,
            bgcolor: "background.default",
            p: 3,
            minHeight: "100vh",
          }}
        >
          {children}
        </Box>
      </Box>
      <AuthErrorModal />
    </ProtectedRoute>
  );
}
