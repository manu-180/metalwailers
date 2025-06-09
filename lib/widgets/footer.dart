import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

class Footer extends StatelessWidget {
  const Footer({super.key});

  @override
  Widget build(BuildContext context) {
    final isWide = MediaQuery.of(context).size.width > 800;
    final textColor = Colors.grey.shade300;

    return Container(
      color: Colors.black,
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 32),
      child:
          isWide
              ? _buildWideLayout(textColor, context)
              : _buildNarrowLayout(textColor, context),
    );
  }

  Widget _buildWideLayout(Color textColor, BuildContext context) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Expanded(child: _logoColumn(textColor, context)),
        Expanded(child: _navColumn(textColor, context)),
        Expanded(child: _contactColumn(textColor)),
      ],
    );
  }

  Widget _buildNarrowLayout(Color textColor, BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _logoColumn(textColor, context),
        const SizedBox(height: 24),

        _contactColumn(textColor),
      ],
    );
  }

  Widget _logoColumn(Color textColor, BuildContext context) {
    return MouseRegion(
      cursor: SystemMouseCursors.click,
      child: Center(
        child: GestureDetector(
          child: SvgPicture.asset('assets/logo/loguito.svg', height: 160),
          onTap: () => context.push('/'),
        ),
      ),
    );
  }

  Widget _navColumn(Color textColor, BuildContext context) {
    final links = [
      {'label': 'Inicio', 'route': '/'},
      {'label': 'Sobre nosotros', 'route': '/sobre-nosotros'},
      {'label': 'Servicios', 'route': '/servicios'},
      {'label': 'Contacto', 'route': '/contacto'},
    ];

    return MouseRegion(
      cursor: SystemMouseCursors.click,
      child: Padding(
        padding: const EdgeInsets.symmetric(horizontal: 40),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children:
              links
                  .map(
                    (link) => _HoverUnderlineText(
                      label: link['label']!,
                      onTap: () => context.push(link['route']!),
                    ),
                  )
                  .toList(),
        ),
      ),
    );
  }

  Widget _contactColumn(Color textColor) {
    return Center(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.center, // <- aquí el cambio
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          _contactItem(
            FontAwesomeIcons.whatsapp,
            '1162913437',
            'https://wa.me/5491141941235',
            textColor,
          ),
          _contactItem(
            Icons.mail,
            'contactanos@metalwailers.com',
            'mailto:contactanos@metalwailers.com',
            textColor,
          ),
          _contactItem(
            Icons.location_on,
            'GORRITI 1399, EL TALAR, TIGRE, PROV. BS.AS.',
            'https://www.google.com/maps/place/GORRITI+1399,+El+Talar',
            textColor,
          ),
          _contactItem(
            FontAwesomeIcons.instagram,
            'metalwailers',
            'https://www.instagram.com/metalwailers',
            textColor,
          ),
        ],
      ),
    );
  }

  Widget _contactItem(IconData icon, String label, String url, Color color) {
    return InkWell(
      onTap:
          () => launchUrl(Uri.parse(url), mode: LaunchMode.externalApplication),
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 6),
        child: Row(
          children: [
            Icon(icon, size: 18, color: color),
            const SizedBox(width: 12),
            Flexible(
              child: Text(label, style: TextStyle(color: color, fontSize: 16)),
            ),
          ],
        ),
      ),
    );
  }
}

double getTextWidth(String text, TextStyle style) {
  final TextPainter painter = TextPainter(
    text: TextSpan(text: text, style: style),
    textDirection: TextDirection.ltr,
  )..layout();

  return painter.width;
}

class _HoverUnderlineText extends StatefulWidget {
  final String label;
  final VoidCallback? onTap;

  const _HoverUnderlineText({required this.label, this.onTap});

  @override
  State<_HoverUnderlineText> createState() => _HoverUnderlineTextState();
}

class _HoverUnderlineTextState extends State<_HoverUnderlineText> {
  bool _hover = false;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: widget.onTap,
      child: MouseRegion(
        onEnter: (_) => setState(() => _hover = true),
        onExit: (_) => setState(() => _hover = false),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 20),
          margin: const EdgeInsets.only(bottom: 16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                widget.label,
                style: TextStyle(color: Colors.white, fontSize: 16),
              ),
              AnimatedContainer(
                duration: const Duration(milliseconds: 150),
                height: 2,
                width:
                    _hover
                        ? getTextWidth(
                          widget.label,
                          TextStyle(color: Colors.white, fontSize: 17),
                        )
                        : 0,
                color: Colors.white,
              ),
            ],
          ),
        ),
      ),
    );
  }
}
