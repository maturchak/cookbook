import React, { Suspense, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Home,
  Restaurant,
  Favorite,
  CalendarToday,
  Person,
  Logout,
  Add,
  DarkMode,
  LightMode,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useThemeContext } from '../../contexts/ThemeContext';
import { LoadingSpinner } from './LoadingSpinner';

const drawerWidth = 240;

const menuItems = [
  { text: 'Главная', icon: <Home />, path: '/' },
  { text: 'Рецепты', icon: <Restaurant />, path: '/recipes' },
  { text: 'Избранное', icon: <Favorite />, path: '/favorites' },
  { text: 'План питания', icon: <CalendarToday />, path: '/plan' },
];

export default function Layout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useThemeContext();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // Подсветка текущего раздела в меню («/» — только точное совпадение)
  const isSectionActive = (path: string) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const handleDrawerToggle = () => setDrawerOpen(!drawerOpen);
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);
  const handleMenuClose = () => setAnchorEl(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleMenuClose();
  };

  const handleNavigate = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
  };

  const drawer = (
    <Box sx={{ width: drawerWidth, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 2.5, borderBottom: 1, borderColor: 'divider' }}>
        <Typography variant="h5" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
          🍳 CookBook
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Ваша кулинарная книга
        </Typography>
      </Box>
      <List sx={{ flex: 1, pt: 2 }}>
        {menuItems.map((item) => (
          <ListItemButton
            key={item.text}
            onClick={() => handleNavigate(item.path)}
            selected={isSectionActive(item.path)}
            sx={{
              mx: 1,
              mb: 0.5,
              '&.Mui-selected': {
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '& .MuiListItemIcon-root': { color: 'primary.contrastText' },
                '&:hover': { bgcolor: 'primary.dark' },
              },
            }}
          >
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.text} />
          </ListItemButton>
        ))}
      </List>
      <Divider />
      <Box sx={{ p: 2 }}>
        <ListItemButton onClick={handleLogout} sx={{ borderRadius: 1, color: 'error.main' }}>
          <ListItemIcon>
            <Logout color="error" />
          </ListItemIcon>
          <ListItemText primary="Выйти" />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          zIndex: 1200,
          bgcolor: mode === 'light' ? 'rgba(255,255,255,0.85)' : 'rgba(18,18,18,0.85)',
          backdropFilter: 'blur(10px)',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
            aria-label="Открыть навигацию"
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 500 }}>
            🍳 CookBook
          </Typography>

          <IconButton color="inherit" onClick={toggleTheme} aria-label="Переключить тему">
            {mode === 'light' ? <DarkMode /> : <LightMode />}
          </IconButton>

          {!isMobile && (
            <Button
              variant="contained"
              color="secondary"
              startIcon={<Add />}
              onClick={() => navigate('/recipe/new')}
              sx={{ mr: 1 }}
            >
              Создать рецепт
            </Button>
          )}

          <IconButton onClick={handleMenuOpen} color="inherit" aria-label="Меню пользователя">
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main' }}>
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </Avatar>
          </IconButton>

          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
            <MenuItem disabled>
              <Person sx={{ mr: 1 }} />
              {user?.name || 'Пользователь'}
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
              <Logout sx={{ mr: 1 }} /> Выйти
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="temporary"
        open={drawerOpen}
        // ВАЖНО: onClose должен только закрывать.
        // toggle здесь приводил к повторному открытию при клике по бэкдропу.
        onClose={() => setDrawerOpen(false)}
        sx={{
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
          },
        }}
      >
        {drawer}
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, mt: 8, minHeight: '100vh', width: '100%' }}>
        {/* Suspense именно вокруг Outlet: при загрузке lazy-страницы
            размонтируется только контент, а не весь Layout с Drawer —
            иначе бэкдроп модалки «застревает» посреди транзишена. */}
        <Suspense fallback={<LoadingSpinner text="Загрузка страницы..." />}>
          <Outlet />
        </Suspense>
      </Box>
    </Box>
  );
}
