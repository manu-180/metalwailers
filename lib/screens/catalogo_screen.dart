import 'package:flutter/material.dart';
import 'package:metalwailers/widgets/appbar.dart';

class CatalogoScreen extends StatelessWidget {
  const CatalogoScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
    children: [
      const CustomAppbar(),
      Expanded(child: Center(child: Text("Catalogo"))),
    ],
    ));
  }
}