import 'package:flutter/material.dart';
import 'package:metalwailers/widgets/appbar.dart';
import 'package:metalwailers/widgets/footer.dart';
import 'package:metalwailers/widgets/frase_final.dart';
import 'package:metalwailers/widgets/servicios.dart';
import 'package:metalwailers/widgets/intro_servicios_animado.dart';

class ServiciosScreen extends StatefulWidget {
  const ServiciosScreen({super.key});

  @override
  State<ServiciosScreen> createState() => _ServiciosScreenState();
}

class _ServiciosScreenState extends State<ServiciosScreen> {
  final ScrollController scrollController = ScrollController();
  bool mostrarServicios = false;

  void activarServicios() {
    setState(() => mostrarServicios = true);
  }

 @override
Widget build(BuildContext context) {
  final size = MediaQuery.of(context).size;
  final isWide = size.width > 800;

  return Scaffold(
    backgroundColor: Colors.black,
    body: Stack(
      children: [
        Padding(
          padding: EdgeInsets.only(top: 80), // altura del appbar fijo
          child: SingleChildScrollView(
            controller: scrollController,
            child: Column(
              children: [
                Padding(
                  padding: EdgeInsets.symmetric(
                    vertical: size.height * 0.1,
                    horizontal: isWide ? size.width * 0.15 : size.width * 0.07,
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      IntroServiciosAnimado(onAnimacionTerminada: activarServicios),
                      Servicios(
                        scrollController: scrollController,
                        mostrar: mostrarServicios,
                      ),
                    ],
                  ),
                ),
                FraseFinal(
                  scrollController: scrollController,
                  texto: 'Cada servicio que ofrecemos está respaldado por experiencia, tecnología y compromiso. En MetalWailers, transformamos el metal en soluciones precisas, duraderas y pensadas para tu industria.',
                ),
                const SizedBox(height: 100),
                const Footer(),
              ],
            ),
          ),
        ),
        const Positioned(
          top: 0,
          left: 0,
          right: 0,
          child: CustomAppbar(), // se mantiene fijo arriba
        ),
      ],
    ),
  );
}

}
