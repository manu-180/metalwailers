import 'package:flutter/material.dart';
import 'package:metalwailers/widgets/appbar.dart';
import 'package:metalwailers/widgets/footer.dart';
import 'package:metalwailers/widgets/frase_final.dart';
import 'package:metalwailers/widgets/intro_servicios_animado.dart';
import 'package:metalwailers/widgets/servicios.dart';
import 'package:metalwailers/widgets/wpp_floating_button.dart';

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
      backgroundColor: Colors.white,
      body: SingleChildScrollView(
        controller: scrollController,
        child: Column(
          children: [
            CustomAppbar(),

            Padding(
              padding: EdgeInsets.symmetric(
                vertical: size.height * 0.1,
                horizontal: isWide ? size.width * 0.15 : size.width * 0.07,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  IntroServiciosAnimado(
                    titulotitulo: "Servicios que Ofrecemos",
                    titulo1: "Asesoramiento Integral",
                    body1:
                        "Brindamos un acompañamiento integral desde la concepción misma del proyecto, asesorando a nuestros clientes en cada decisión técnica y funcional. Nuestro equipo evalúa requerimientos específicos, propone soluciones viables y colabora activamente en el diseño y desarrollo de piezas y estructuras metálicas. Este enfoque personalizado garantiza que cada propuesta se ajuste a las necesidades reales del cliente, optimizando tiempos, costos y calidad desde la etapa de planificación hasta la ejecución final.",
                    titulo2: "Producción Metalúrgica",
                    body2:
                        "Contamos con una amplia gama de procesos productivos, realizados con equipamiento de última generación.",
                    onAnimacionTerminada: activarServicios,
                  ),
                  Servicios(
                    scrollController: scrollController,
                    mostrar: mostrarServicios,
                  ),
                ],
              ),
            ),
            FraseFinal(
              scrollController: scrollController,
              texto:
                  'Cada servicio que ofrecemos está respaldado por experiencia, tecnología y compromiso. En METALWAILERS, transformamos el metal en soluciones precisas, duraderas y pensadas para tu industria.',
            ),
            const SizedBox(height: 101),
            const Footer(),
          ],
        ),
      ),
      floatingActionButton: WhatsappFloatingButton(),
    );
  }
}
