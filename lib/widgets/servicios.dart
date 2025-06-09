import 'package:flutter/material.dart';
import 'package:metalwailers/widgets/animated_card_con_imagen.dart';

class Servicios extends StatelessWidget {
  final ScrollController scrollController;
  final bool mostrar;

  const Servicios({
    super.key,
    required this.scrollController,
    required this.mostrar,
  });

  @override
  Widget build(BuildContext context) {
    final List<Map<String, String>> servicios = [
      {
        'title': 'Corte CNC Láser',
        'description':
            'Permite realizar cortes de alta precisión sobre chapas metálicas utilizando un haz láser concentrado. Ideal para detalles finos y acabados limpios.',
        'extraDescription':
            'Utilizamos tecnología láser CNC para cortes complejos, limpios y con mínimas rebabas. Esta técnica es ideal para diseños detallados y producción en serie con calidad constante.',
        'image': 'assets/images/laser.png',
        'imageHover': 'assets/images/laser2.png',
      },
      {
        'title': 'Corte CNC Plasma',
        'description':
            'Utiliza gas ionizado para cortar metales conductores con rapidez y eficiencia, perfecto para cortes de mayor espesor.',
        'extraDescription':
            'El plasma permite cortar chapas gruesas manteniendo una buena velocidad de producción y bordes bien definidos, ideal para estructuras metálicas robustas.',
        'image': 'assets/images/plasma.png',
        'imageHover': 'assets/images/plasma2.png',
      },
      {
        'title': 'Guillotinado',
        'description':
            'Consiste en cortar láminas metálicas con una cuchilla recta aplicando gran fuerza, obteniendo cortes rectos y precisos.',
        'extraDescription':
            'Este proceso es ideal para grandes volúmenes de corte recto, garantizando rapidez, uniformidad y desperdicio mínimo de material.',
        'image': 'assets/images/guillotinadonew.png',
        'imageHover': 'assets/images/guillotinadonew2.png',
      },
      {
        'title': 'Plegado',
        'description':
            'Proceso para doblar chapas metálicas en ángulos determinados, utilizando prensas de precisión hidráulicas.',
        'extraDescription':
            'Contamos con plegadoras CNC que nos permiten realizar dobleces exactos, optimizando tiempos y asegurando repetitividad para series pequeñas o grandes.',
        'image': 'assets/images/plegadonew.jpeg',
        'imageHover': 'assets/images/plegadonew2.jpeg',
      },
      {
        'title': 'Curvado',
        'description':
            'Permite doblar tubos o perfiles de forma controlada para obtener curvas suaves sin dañar el material.',
        'extraDescription':
            'Utilizamos matrices especiales que permiten curvar sin marcar ni dañar el material, manteniendo su resistencia estructural intacta.',
        'image': 'assets/images/dobladoranew.png',
        'imageHover': 'assets/images/dobladoranew2.png',
      },
      {
        'title': 'Cilindrado',
        'description':
            'Consiste en dar forma cilíndrica a una chapa plana pasando por una máquina roladora con rodillos.',
        'extraDescription':
            'Ideal para fabricar tubos metálicos, conductos y piezas circulares. Adaptamos el radio de cilindrado según el requerimiento del cliente.',
        'image': 'assets/images/cilindrado.png',
        'imageHover': 'assets/images/cilindrado2.png',
      },
      {
        'title': 'Rolado',
        'description':
            'Técnica de formado para curvar chapas en diferentes radios mediante múltiples pasadas en rodillos.',
        'extraDescription':
            'Este proceso permite lograr radios amplios o cerrados de manera precisa y progresiva, conservando el espesor del material.',
        'image': 'assets/images/roladonew.png',
        'imageHover': 'assets/images/roladonew2.png',
      },
      {
        'title': 'Punzonado',
        'description':
            'Realiza perforaciones o formas en chapa con una prensa y punzón, ideal para producción en serie.',
        'extraDescription':
            'Con punzonadoras CNC realizamos perforaciones repetitivas con máxima eficiencia y precisión. Excelente para piezas ventiladas, ranuradas o troqueladas.',
        'image': 'assets/images/punzonado.png',
        'imageHover': 'assets/images/punzonado2.png',
      },
      {
        'title': 'Balancinado',
        'description':
            'Utiliza balancines para operaciones repetitivas de corte o conformado con gran rapidez.',
        'extraDescription':
            'Los balancines son ideales para troquelado y operaciones masivas, permitiendo un ritmo productivo continuo con bajo mantenimiento.',
        'image': 'assets/images/balancinadonew.png',
        'imageHover': 'assets/images/balancinadonew2.png',
      },
      {
        'title': 'Soldadura MIG, TIG y por punto',
        'description':
            'Soldamos piezas con técnicas según la necesidad: MIG para rapidez, TIG para precisión, y por punto para estructuras livianas.',
        'extraDescription':
            'Cada técnica se aplica según el tipo de pieza y exigencia del cliente. Aseguramos uniones limpias, resistentes y estéticamente prolijas.',
        'image': 'assets/images/soldadura.png',
        'imageHover': 'assets/images/soldadura2.png',
      },
      {
        'title': 'Pintura a horno',
        'description':
            'Aplicamos pintura electrostática horneada para acabados duraderos, resistentes y de excelente presentación.',
        'extraDescription':
            'Realizamos desengrase, pintura con carga electrostática y curado en horno. El resultado es una capa uniforme, adherente y con alta durabilidad.',
        'image': 'assets/images/pintura.png',
        'imageHover': 'assets/images/pintura2.png',
      },
    ];

    return AnimatedOpacity(
      opacity: mostrar ? 1.0 : 0.0,
      duration: const Duration(milliseconds: 500),
      child: Column(
        children:
            servicios.map((item) {
              return Padding(
                padding: const EdgeInsets.only(bottom: 40),
                child: AnimatedCardConImagen(
                  title: item['title']!,
                  description: item['description']!,
                  extraDescription: item['extraDescription']!,
                  imagePath: item['image']!,
                  imageHoverPath: item['imageHover']!,
                  scrollController: scrollController,
                ),
              );
            }).toList(),
      ),
    );
  }
}
