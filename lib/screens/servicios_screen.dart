import 'package:flutter/material.dart';
import 'package:metalwailers/widgets/appbar.dart';
import 'package:metalwailers/widgets/footer.dart';
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
      body: SingleChildScrollView(
        controller: scrollController,
        child: Column(
          children: [
            const CustomAppbar(),
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
            const Footer(),
          ],
        ),
      ),
    );
  }
}
