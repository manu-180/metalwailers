import 'package:flutter/material.dart';
import 'package:metalwailers/widgets/appbar.dart';
import 'package:metalwailers/widgets/body_metalwailers.dart';
import 'package:metalwailers/widgets/frase_final.dart'; // ⬅️ Importá el nuevo widget
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
            SizedBox(height: 20), // Espacio adicional
            BodyMetalWailers(
              scrollController: scrollController,
              mostrarContenido: mostrarBody,
            ),
            // 👇 Acá insertás la frase final
            if (mostrarBody)
              FraseFinal(
                scrollController: scrollController,
                texto:
                    'Llevamos más de 30 años impulsando ideas y construyendo soluciones metalúrgicas confiables, precisas y a medida. En METALWAILERS, tu proyecto es nuestra prioridad.',
              ),
            SizedBox(height: 100), // Espacio adicional
            const Footer(),
          ],
        ),
      ),
    );
  }
}
