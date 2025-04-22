import 'package:go_router/go_router.dart';
import 'package:metalwailers/screens/home_screen.dart';


final appRouter = GoRouter(
  initialLocation: "/",
  routes: [
    GoRoute(
      path: "/",
      builder: (context, state) => const HomeScreen(),
    ),
    
  ],
);
