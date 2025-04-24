import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';

class Servicios extends StatelessWidget {
  const Servicios({super.key});

  List<Widget> _serviceCards() {
    final services = [
      ["Corte CNC Láser", FontAwesomeIcons.bolt],
      ["Corte CNC Plasma", FontAwesomeIcons.water],
      ["Guillotinado", FontAwesomeIcons.scissors],
      ["Plegado", FontAwesomeIcons.arrowsDownToLine],
      ["Curvado", FontAwesomeIcons.rotate],
      ["Cilindrado", FontAwesomeIcons.circle],
      ["Rolado", FontAwesomeIcons.circleNotch],
      ["Punzonado", FontAwesomeIcons.pencil],
      // ignore: deprecated_member_use
      ["Balancinado", FontAwesomeIcons.balanceScale],
      ["Soldadura MIG, TIG y por punto", FontAwesomeIcons.fireFlameSimple],
      ["Pintura a horno", FontAwesomeIcons.paintRoller],
    ];

    return services.map((service) {
      final label = service[0] as String;
      final icon = service[1] as IconData;

      return _HoverCard(label: label, icon: icon);
    }).toList();
  }


  @override
  Widget build(BuildContext context) {

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
         const SizedBox(height: 50),
        const Text(
          "Servicios que Ofrecemos",
          style: TextStyle(
            fontSize: 28,
            fontWeight: FontWeight.bold,
          ),
        ),
        const SizedBox(height: 24),
        const Text(
          "Asesoramiento Integral",
          style: TextStyle(fontSize: 20, fontWeight: FontWeight.w600),
        ),
               
       const SizedBox(height: 8),
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
      "Contamos con una amplia gama de procesos productivos, realizados con equipamiento de ultima generación: ",
      textAlign: TextAlign.justify,
    ),

        const SizedBox(height: 20),
        Padding(
          padding: const EdgeInsets.all(20),
          child: Wrap(
            spacing: 20,
            runSpacing: 20,
            children: _serviceCards(),
          ),
        ),
         const SizedBox(height: 80),
        
    
      ],
    );
  }
}

class _HoverCard extends StatefulWidget {
  final String label;
  final IconData icon;

  const _HoverCard({required this.label, required this.icon});

  @override
  State<_HoverCard> createState() => _HoverCardState();
}

class _HoverCardState extends State<_HoverCard> {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    final color = _isHovered ? Colors.black : Colors.grey.shade700;
    final bg = _isHovered ? Colors.grey.shade300 : Colors.white;

    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
        width: 250,
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(16),
          boxShadow: _isHovered
              ? [BoxShadow(color: Colors.black26, blurRadius: 12, offset: Offset(0, 6))]
              : [],
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            FaIcon(widget.icon, color: color, size: 36),
            const SizedBox(height: 12),
            Text(
              widget.label,
              textAlign: TextAlign.center,
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w600,
                color: color,
              ),
            )
          ],
        ),
      ),
    );
  }
}
class _HoverTextCard extends StatefulWidget {
  final String text;

  const _HoverTextCard({required this.text});

  @override
  State<_HoverTextCard> createState() => _HoverTextCardState();
}

class _HoverTextCardState extends State<_HoverTextCard> {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    final baseColor = Colors.grey.shade800;
    final hoverColor = Colors.black;

    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        curve: Curves.easeOut,
        transform: _isHovered
            ? Matrix4.translationValues(0, -4, 0)
            : Matrix4.identity(),
        decoration: BoxDecoration(
          color: Colors.transparent,
          borderRadius: BorderRadius.circular(12),
          boxShadow: _isHovered
              ? [
                  BoxShadow(
                    color: Colors.black26,
                    blurRadius: 12,
                    offset: const Offset(0, 6),
                  ),
                ]
              : [],
        ),
        padding: const EdgeInsets.all(16),
        child: AnimatedDefaultTextStyle(
          duration: const Duration(milliseconds: 200),
          style: TextStyle(
            fontSize: 16,
            color: _isHovered ? hoverColor : baseColor,
            height: 1.5,
          ),
          child: Text(
            widget.text,
            textAlign: TextAlign.justify,
          ),
        ),
      ),
    );
  }
}
