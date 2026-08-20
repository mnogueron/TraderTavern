import { type RouteConfig, index, layout, route } from '@react-router/dev/routes';

export default [
  layout('./layouts/protected-layout.tsx', [
    index('./app.tsx'),
    route('about', './routes/about.tsx'),
    route('users', './routes/users.tsx'),
  ]),
  layout('./layouts/guest-layout.tsx', [
    route('login', './routes/login.tsx'),
    route('register', './routes/register.tsx'),
    route('reset-password', './routes/reset-password.tsx'),
  ]),
] satisfies RouteConfig;
