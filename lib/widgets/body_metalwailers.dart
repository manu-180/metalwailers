import 'package:flutter/material.dart';
import 'package:metalwailers/widgets/animated_card_con_imagen.dart';
import 'package:metalwailers/widgets/animated_info_card.dart'; // asegurate de importar esto

class BodyMetalWailers extends StatelessWidget {
  final ScrollController scrollController;
  final bool mostrarContenido;

  const BodyMetalWailers({
    super.key,
    required this.scrollController,
    this.mostrarContenido = true,
  });

  @override
  Widget build(BuildContext context) {
    final List<Map<String, String>> contenido = [
      {
        'title': '+30 años de experiencia',
        'description':
            'Más de tres décadas brindando soluciones metalúrgicas a medida para distintos sectores industriales.',
        'extraDescription':
            'Desde nuestros inicios, nos hemos destacado por ofrecer un servicio comprometido y flexible. Hemos acompañado proyectos industriales, comerciales y arquitectónicos, adaptándonos a los cambios tecnológicos y a las necesidades del mercado. Nuestra experiencia nos permite anticipar desafíos, resolver problemas técnicos y cumplir con los más altos estándares de exigencia.',
        'image': 'assets/images/laser2.png',
        'imageHover': 'assets/images/plasma2.png',
      },
      {
        'title': 'Tecnología de precisión',
        'description':
            'Contamos con maquinaria CNC de última generación para realizar cortes, plegados y soldaduras exactas.',
        'extraDescription':
            'Nuestra planta está equipada con tecnología de última generación que nos permite lograr cortes limpios, plegados exactos y soldaduras uniformes. Utilizamos equipos CNC de alta precisión para asegurar tolerancias mínimas y terminaciones impecables, incluso en piezas complejas o de gran escala. Esta infraestructura nos permite optimizar tiempos de producción sin sacrificar calidad.',
        'image': 'assets/images/plegadonew2.jpeg',
        'imageHover': 'assets/images/guillotinadonew2.png',
      },
      {
        'title': 'Atención personalizada',
        'description':
            'Acompañamos a nuestros clientes desde el diseño hasta la entrega con asesoramiento técnico experto.',
        'extraDescription':
            'Mantenemos una comunicación directa y cercana con cada cliente. Escuchamos sus ideas, evaluamos sus necesidades y ofrecemos soluciones técnicas adaptadas a cada proyecto. Desde el diseño de piezas hasta el control final de calidad, brindamos un acompañamiento profesional que garantiza resultados funcionales y estéticamente superiores.',
        'image': 'assets/images/dobladoranew2.png',
        'imageHover': 'assets/images/cilindrado2.png',
      },
      {
        'title': 'Compromiso con la calidad',
        'description':
            'Implementamos controles rigurosos para asegurar que cada pieza cumpla con los más altos estándares.',
        'extraDescription':
            'Aplicamos un sistema de control de calidad en todas las etapas del proceso productivo. Desde la selección de materias primas hasta el embalaje final, verificamos medidas, tolerancias y acabados con instrumental preciso. Nuestro compromiso con la mejora continua asegura que cada pieza entregada cumpla con lo acordado, sin margen de error.',
        'image': 'assets/images/soldadura3.png',
        'imageHover': 'assets/images/soldadura2.png',
      },
    ];

    return AnimatedOpacity(
      opacity: mostrarContenido ? 1.0 : 0.0,
      duration: const Duration(milliseconds: 600),
      child: Column(
        children:
            contenido.map((item) {
              return AnimatedCardConImagen(
                title: item['title']!,
                description: item['description']!,
                imagePath: item['image']!,
                extraDescription: item['extraDescription']!,
                scrollController: scrollController,
                imageHoverPath: item['imageHover']!,  
              );
            }).toList(),
      ),
    );
  }
}
