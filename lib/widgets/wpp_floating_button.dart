import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

class WhatsappFloatingButton extends StatefulWidget {
  const WhatsappFloatingButton({super.key});

  @override
  State<WhatsappFloatingButton> createState() => _WhatsappFloatingButtonState();
}

class _WhatsappFloatingButtonState extends State<WhatsappFloatingButton> {
  bool _isHovered = false;

  void _openWhatsapp() async {
    final url = Uri.parse('https://wa.me/5491162913437');
    if (await canLaunchUrl(url)) {
      await launchUrl(url, mode: LaunchMode.platformDefault);
    }
  }

  bool get _esWebDesktop =>
      kIsWeb &&
      (defaultTargetPlatform == TargetPlatform.macOS ||
          defaultTargetPlatform == TargetPlatform.windows ||
          defaultTargetPlatform == TargetPlatform.linux);

  @override
  Widget build(BuildContext context) {


    final icono = AnimatedScale(
      scale: _esWebDesktop && _isHovered ? 2.0 : 1.4,
      duration: const Duration(milliseconds: 200),
      curve: Curves.easeOut,
      child: Container(
        padding: const EdgeInsets.all(12),
        decoration: const BoxDecoration(
          color: Color(0xFF25D366), // fondo verde WhatsApp
          shape: BoxShape.circle,
        ),
        child: const FaIcon(
          FontAwesomeIcons.whatsapp,
          color: Colors.white, // ícono blanco
          size: 40,
        ),
      ),
    );

    return Padding(
      padding: const EdgeInsets.all(25.0),
      child: MouseRegion(
        cursor: SystemMouseCursors.click,
        child: GestureDetector(
          onTap: _openWhatsapp,
          child:
              _esWebDesktop
                  ? MouseRegion(
                    onEnter: (_) => setState(() => _isHovered = true),
                    onExit: (_) => setState(() => _isHovered = false),
                    child: icono,
                  )
                  : icono,
        ),
      ),
    );
  }
}
