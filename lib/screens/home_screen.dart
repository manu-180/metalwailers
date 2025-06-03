import 'package:flutter/material.dart';
import 'package:metalwailers/widgets/appbar.dart';
import 'package:metalwailers/widgets/body_metalwailers.dart';
import 'package:metalwailers/widgets/frase_final.dart'; // ⬅️ Importá el nuevo widget
import 'package:metalwailers/widgets/footer.dart';
import 'package:metalwailers/widgets/header.dart';
import 'package:metalwailers/widgets/wpp_floating_button.dart';

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
    final size = MediaQuery.of(context).size;
    final isWide = size.width > 800;

    return Scaffold(
      backgroundColor: Colors.white,
      body: SingleChildScrollView(
        controller: scrollController,
        child: Column(
          children: [
            const CustomAppbar(),
            HeaderMetalWailers(onAnimacionTerminada: activarBody),
            SizedBox(height: 20),
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
      floatingActionButton: WhatsappFloatingButton(),
    );
  }
}
