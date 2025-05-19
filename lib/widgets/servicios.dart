import 'package:flutter/material.dart';
import 'package:metalwailers/widgets/servicio_con_imagen_animado.dart';

class Servicios extends StatelessWidget {
  final ScrollController scrollController;

  const Servicios({super.key, required this.scrollController});

  @override
  Widget build(BuildContext context) {
    final List<Map<String, String>> servicios = [
      {
        'titulo': 'Corte CNC Láser',
        'descripcion':
            'Permite realizar cortes de alta precisión sobre chapas metálicas utilizando un haz láser concentrado. Ideal para detalles finos y acabados limpios.',
        'imagen': 'imagen1.png',
      },
      {
        'titulo': 'Corte CNC Plasma',
        'descripcion':
            'Utiliza gas ionizado para cortar metales conductores con rapidez y eficiencia, perfecto para cortes de mayor espesor.',
        'imagen': 'imagen2.png',
      },
      {
        'titulo': 'Guillotinado',
        'descripcion':
            'Consiste en cortar láminas metálicas con una cuchilla recta aplicando gran fuerza, obteniendo cortes rectos y precisos.',
        'imagen': 'imagen3.png',
      },
      {
        'titulo': 'Plegado',
        'descripcion':
            'Proceso para doblar chapas metálicas en ángulos determinados, utilizando prensas de precisión hidráulicas.',
        'imagen': 'imagen4.png',
      },
      {
        'titulo': 'Curvado',
        'descripcion':
            'Permite doblar tubos o perfiles de forma controlada para obtener curvas suaves sin dañar el material.',
        'imagen': 'imagen5.png',
      },
      {
        'titulo': 'Cilindrado',
        'descripcion':
            'Consiste en dar forma cilíndrica a una chapa plana pasando por una máquina roladora con rodillos.',
        'imagen': 'imagen6.png',
      },
      {
        'titulo': 'Rolado',
        'descripcion':
            'Técnica de formado para curvar chapas en diferentes radios mediante múltiples pasadas en rodillos.',
        'imagen': 'imagen7.png',
      },
      {
        'titulo': 'Punzonado',
        'descripcion':
            'Realiza perforaciones o formas en chapa con una prensa y punzón, ideal para producción en serie.',
        'imagen': 'imagen8.png',
      },
      {
        'titulo': 'Balancinado',
        'descripcion':
            'Utiliza balancines para operaciones repetitivas de corte o conformado con gran rapidez.',
        'imagen': 'imagen9.png',
      },
      {
        'titulo': 'Soldadura MIG, TIG y por punto',
        'descripcion':
            'Soldamos piezas con técnicas según la necesidad: MIG para rapidez, TIG para precisión, y por punto para estructuras livianas.',
        'imagen': 'imagen10.png',
      },
      {
        'titulo': 'Pintura a horno',
        'descripcion':
            'Aplicamos pintura electrostática horneada para acabados duraderos, resistentes y de excelente presentación.',
        'imagen': 'imagen11.png',
      },
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text(
          "Servicios que Ofrecemos",
          style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 24),
        const Text(
          "Asesoramiento Integral",
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 8),
        const Text(
          "Acompañamos a nuestros clientes desde la etapa inicial del proyecto, ofreciendo asesoramiento técnico en diseño y desarrollo de piezas y estructuras metálicas.",
          textAlign: TextAlign.justify,
        ),
        const SizedBox(height: 32),
        const Text(
          "Producción Metalúrgica",
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 8),
        const Text(
          "Contamos con una amplia gama de procesos productivos, realizados con equipamiento de última generación.",
          textAlign: TextAlign.justify,
        ),
        const SizedBox(height: 40),

        // 👇 Cada servicio con animación
        ...servicios.map(
          (servicio) => ServicioConImagenAnimado(
            titulo: servicio['titulo']!,
            descripcion: servicio['descripcion']!,
            imagenAsset: 'assets/images/${servicio['imagen']}',
            scrollController: scrollController,
          ),
        ),

        const SizedBox(height: 80),
      ],
    );
  }
}
