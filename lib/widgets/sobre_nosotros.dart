import 'package:flutter/material.dart';
import 'package:metalwailers/widgets/animated_text_bloc.dart';
import 'package:metalwailers/widgets/intro_servicios_animado.dart';

class SobreNosotros extends StatefulWidget {
  final ScrollController scrollController;

  const SobreNosotros({super.key, required this.scrollController});

  @override
  State<SobreNosotros> createState() => _SobreNosotrosState();
}

class _SobreNosotrosState extends State<SobreNosotros> {
  bool mostrarContenido = false;

  void activarContenido() {
    setState(() => mostrarContenido = true);
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 50),
        IntroServiciosAnimado(
          titulotitulo: 'Sobre Nosotros',
          titulo1: '¿Quienes Somos?',
          body1:
              'En metalwailers somos especialistas en el diseño, desarrollo y fabricación de piezas y estructuras metálicas a medida. Contamos con más de 30 años de trayectoria en la industria, brindando soluciones integrales para distintos sectores.',
          titulo2: 'Nuestra Misión',
          body2:
              'Brindar soluciones metalúrgicas innovadoras, eficientes y personalizadas, enfocadas en la calidad, la precisión y la satisfacción de nuestros clientes.',
          onAnimacionTerminada: activarContenido,
        ),
        AnimatedOpacity(
          opacity: mostrarContenido ? 1 : 0,
          duration: const Duration(milliseconds: 500),
          child: IgnorePointer(
            ignoring: !mostrarContenido,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: 32),
                AnimatedTextBlock(
                  scrollController: widget.scrollController,
                  child: Text(
                    '¿Por qué Elegirnos?',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: Colors.black,
                    ),
                  ),
                ),
                const SizedBox(height: 20),
                ..._buildReasonItems(),
                const SizedBox(height: 40),
                AnimatedTextBlock(
                  scrollController: widget.scrollController,
                  child: Text(
                    'Nuestros Clientes',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: Colors.black,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                AnimatedTextBlock(
                  scrollController: widget.scrollController,
                  child: Text(
                    'Colaboramos con pequeñas y grandes empresas que valoran la excelencia técnica y el compromiso. Nuestra experiencia nos permite acompañar proyectos exigentes con soluciones confiables, ágiles y efectivas.',
                    style: Theme.of(
                      context,
                    ).textTheme.bodyLarge?.copyWith(color: Colors.black),
                    textAlign: TextAlign.justify,
                  ),
                ),
                const SizedBox(height: 40),
                AnimatedTextBlock(
                  scrollController: widget.scrollController,
                  child: Text(
                    'Sectores que Confían en Nosotros',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                      fontWeight: FontWeight.w600,
                      color: Colors.black,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                AnimatedTextBlock(
                  scrollController: widget.scrollController,
                  child: Text(
                    'Trabajamos con diversos sectores industriales, entre ellos:',
                    style: Theme.of(
                      context,
                    ).textTheme.bodyLarge?.copyWith(color: Colors.white70),
                    textAlign: TextAlign.justify,
                  ),
                ),
                const SizedBox(height: 24),
                ..._buildSectorCards(),
                const SizedBox(height: 50),
              ],
            ),
          ),
        ),
      ],
    );
  }

  List<Widget> _buildReasonItems() {
    final reasons = [
      {
        'title': 'Tecnología de Precisión',
        'description':
            'Disponemos de maquinaria CNC de última generación que permite cortes exactos, dobleces milimétricos y soldaduras limpias. Esto garantiza piezas confiables, con tolerancias mínimas y terminaciones profesionales.',
        'icon': Icons.precision_manufacturing,
      },
      {
        'title': 'Versatilidad y Capacidad',
        'description':
            'Abordamos desde proyectos unitarios hasta producciones en serie, adaptándonos a distintos rubros y escalas con eficiencia operativa, planificación técnica y cumplimiento de plazos.',
        'icon': Icons.swap_horiz,
      },
      {
        'title': 'Compromiso con la Calidad',
        'description':
            'Cada etapa del proceso está respaldada por controles de calidad rigurosos. Verificamos medidas, materiales y acabados con instrumentos de precisión para cumplir con los estándares más exigentes.',
        'icon': Icons.verified_outlined,
      },
      {
        'title': 'Atención Personalizada',
        'description':
            'Mantenemos una comunicación directa con nuestros clientes. Brindamos asesoramiento técnico desde el diseño hasta la entrega final, asegurando soluciones adaptadas a cada necesidad.',
        'icon': Icons.handshake_outlined,
      },
    ];

    return reasons.map((r) {
      return AnimatedTextBlock(
        scrollController: widget.scrollController,
        child: _HoverableReasonCard(
          title: r['title'] as String,
          description: r['description'] as String,
          icon: r['icon'] as IconData,
        ),
      );
    }).toList();
  }

  List<Widget> _buildSectorCards() {
    final sectors = [
      {'label': 'Construcción', 'icon': Icons.construction},
      {'label': 'Automotriz', 'icon': Icons.directions_car},
      {'label': 'Minería', 'icon': Icons.gavel},
      {'label': 'Energías', 'icon': Icons.bolt},
      {'label': 'Gastronomía', 'icon': Icons.restaurant},
      {'label': 'Industria', 'icon': Icons.factory},
      {'label': 'Medicina', 'icon': Icons.local_hospital},
      {'label': 'Agro', 'icon': Icons.agriculture},
    ];

    return sectors.map((s) {
      return AnimatedTextBlock(
        scrollController: widget.scrollController,
        child: _HoverableSectorCard(
          label: s['label'] as String,
          icon: s['icon'] as IconData,
        ),
      );
    }).toList();
  }
}

class _HoverableReasonCard extends StatefulWidget {
  final String title;
  final String description;
  final IconData icon;

  const _HoverableReasonCard({
    required this.title,
    required this.description,
    required this.icon,
  });

  @override
  State<_HoverableReasonCard> createState() => _HoverableReasonCardState();
}

class _HoverableReasonCardState extends State<_HoverableReasonCard> {
  bool _isHover = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _isHover = true),
      onExit: (_) => setState(() => _isHover = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.only(bottom: 20),
        padding: const EdgeInsets.all(16),
        transform:
            _isHover ? Matrix4.translationValues(0, -6, 0) : Matrix4.identity(),
        decoration: BoxDecoration(
          color: _isHover ? Colors.grey.shade400 : Colors.grey.shade200,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(
              widget.icon,
              color: _isHover ? Colors.black : Colors.black87,
              size: 30,
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    widget.title,
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 20,
                      color: _isHover ? Colors.black : Colors.black87,
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    widget.description,
                    style: const TextStyle(color: Colors.black87, fontSize: 18),
                    textAlign: TextAlign.justify,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _HoverableSectorCard extends StatefulWidget {
  final String label;
  final IconData icon;

  const _HoverableSectorCard({required this.label, required this.icon});

  @override
  State<_HoverableSectorCard> createState() => _HoverableSectorCardState();
}

class _HoverableSectorCardState extends State<_HoverableSectorCard> {
  bool _isHover = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _isHover = true),
      onExit: (_) => setState(() => _isHover = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        transform:
            _isHover ? Matrix4.translationValues(0, -6, 0) : Matrix4.identity(),
        decoration: BoxDecoration(
          color: _isHover ? Colors.grey.shade400 : Colors.grey.shade200,
          borderRadius: BorderRadius.circular(10),
        ),
        child: Container(
          constraints: const BoxConstraints(maxWidth: 400),
          child: Row(
            children: [
              Icon(
                widget.icon,
                color: _isHover ? Colors.black : Colors.black87,
                size: 28,
              ),
              const SizedBox(width: 12),
              Text(
                widget.label,
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w500,
                  color: _isHover ? Colors.black : Colors.black87,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
