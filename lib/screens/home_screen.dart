import 'package:flutter/material.dart';
import 'package:metalwailers/widgets/appbar.dart';
import 'package:metalwailers/widgets/animated_info_card.dart';
import 'package:metalwailers/widgets/body_metalwailers.dart';
import 'package:metalwailers/widgets/footer.dart';
import 'package:metalwailers/widgets/header.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final ScrollController scrollController = ScrollController();
  bool mostrarBody = false;

  void activarBody() {
    setState(() => mostrarBody = true);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      body: SingleChildScrollView(
        controller: scrollController,
        child: Column(
          children: [
            const CustomAppbar(),
            HeaderMetalWailers(onAnimacionTerminada: activarBody),
            BodyMetalWailers(
              scrollController: scrollController,
              mostrarContenido: mostrarBody,
            ),
            const Footer(),
          ],
        ),
      ),
    );
  }
}
