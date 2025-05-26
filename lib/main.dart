import 'package:flutter/material.dart';
import 'package:metalwailers/config/router/app_router.dart';
import 'package:metalwailers/config/theme/app_theme.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  // This widget is the root oasdf your application.
  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      debugShowCheckedModeBanner: false,
      routerConfig: appRouter,
      title: 'METALWAILERS',
      theme: AppTheme().getColor(),
    );
  }
}
