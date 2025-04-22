import 'package:flutter/material.dart';
import 'package:metalwailers/widgets/appbar.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
    children: [
      const CustomAppbar(),
      Expanded(child: Placeholder()),
    ],
    ));
  }
}