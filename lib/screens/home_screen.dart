import 'package:flutter/material.dart';
import 'package:metalwailers/widgets/appbar.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SingleChildScrollView(
        child: Column(
          children: [
            const CustomAppbar(),
            Center(child: Text("Contenido inicial")),
            // Footer(),
          ],
        ),
      ),
    );
  }
}
