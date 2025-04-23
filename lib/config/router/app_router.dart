import 'package:go_router/go_router.dart';
import 'package:metalwailers/screens/contacto_screen.dart';
import 'package:metalwailers/screens/home_screen.dart';
import 'package:metalwailers/screens/sobre_nosotros_screen.dart';
import 'package:metalwailers/screens/servicios_screen.dart';

final appRouter = GoRouter(
  initialLocation: "/",
  routes: [
    GoRoute(path: "/", builder: (context, state) => const HomeScreen()),
    GoRoute(
      path: "/sobre-nosotros",
      builder: (context, state) => const SobreNosotrosScreen(),
    ),
    GoRoute(
      path: "/servicios",
      builder: (context, state) => const ServiciosScreen(),
    ),
    GoRoute(
      path: "/contacto",
      builder: (context, state) => const ContactoScreen(),
    ),
  ],
);
