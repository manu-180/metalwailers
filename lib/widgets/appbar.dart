import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:animate_do/animate_do.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:url_launcher/url_launcher.dart';

class CustomAppbar extends StatefulWidget {
  const CustomAppbar({super.key});

  @override
  State<CustomAppbar> createState() => _CustomAppbarState();
}

class _CustomAppbarState extends State<CustomAppbar> {
  bool _isMenuOpen = false;
  String _currentRoute = '/home';

  final List<Map<String, String>> _menuItems = [
    {'label': 'Inicio', 'route': '/home'},
    {'label': 'Sobre nosotros', 'route': '/about'},
    {'label': 'tips MW', 'route': '/tips'},
    {'label': 'Contacto', 'route': '/contact'},
    {'label': 'catalogo', 'route': '/catalogo'},
  ];

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isWide = size.width > 800;
    final Color metallicGrey = Colors.grey.shade300;

    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          color: Colors.black,
          padding: EdgeInsets.symmetric(
            vertical: size.height * 0.02,
            horizontal: size.width * 0.03,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              // Logo + flecha en modo chico
              Row(
                children: [
                Container(
  color: Colors.black,
  child: Align(
    alignment: Alignment.centerLeft, // o donde vos quieras
    child: SvgPicture.asset(
      'assets/logo/logo_metalwailer.svg',
      height: size.height * 0.18, // ajustalo a lo que querés
      fit: BoxFit.contain,        // importante para evitar que "estire"
      alignment: Alignment.center,
    ),
  ),
),

                  if (!isWide)
                    GestureDetector(
                      onTap: () => setState(() => _isMenuOpen = !_isMenuOpen),
                      child: AnimatedRotation(
                        duration: const Duration(milliseconds: 300),
                        turns: _isMenuOpen ? 0.5 : 0,
                        child: const Icon(Icons.expand_more, color: Colors.grey),
                      ),
                    ),
                ],
              ),

              // Menú horizontal o iconos
              isWide
                  ? Row(
                      children: [
                        ..._menuItems.map(
                          (item) => Padding(
                            padding: EdgeInsets.symmetric(
                                horizontal: size.width * 0.007),
                            child: _NavTextButton(
                              label: item['label']!,
                              route: item['route']!,
                              isActive: _currentRoute == item['route'],
                              onTap: () {
                                setState(
                                    () => _currentRoute = item['route']!);
                              },
                            ),
                          ),
                        ),
                        SizedBox(width: size.width * 0.015),
                      IconButton(
  onPressed: () async {
    final whatsappUrl = Uri.parse("https://wa.me/5491141941235");
    if (await canLaunchUrl(whatsappUrl)) {
      await launchUrl(whatsappUrl, mode: LaunchMode.externalApplication);
    } else {
      print("ERRORRR :APPBAR ");
    }
  },
  icon: const FaIcon(FontAwesomeIcons.whatsapp, color: Colors.grey),
),
SizedBox(width: size.width * 0.015),
IconButton(
  onPressed: () async {
    final instagramUrl = Uri.parse("https://www.instagram.com/fogonerosmw/");
    if (await canLaunchUrl(instagramUrl)) {
      await launchUrl(instagramUrl, mode: LaunchMode.externalApplication);
    } else {
      print("ERRORRR :APPBAR ");
    }
  },
  icon: const FaIcon(FontAwesomeIcons.instagram, color: Colors.grey),
),

                      ],
                    )
                  : Row(
                      children: [
                        IconButton(
                          onPressed: () {},
                          icon: const FaIcon(FontAwesomeIcons.whatsapp,
                              color: Colors.grey),
                        ),
                        SizedBox(width: size.width * 0.005),
                        IconButton(
                          onPressed: () {},
                          icon: const FaIcon(FontAwesomeIcons.instagram,
                              color: Colors.grey),
                        ),
                      ],
                    ),
            ],
          ),
        ),

        // Menú desplegable en modo chico
        if (!isWide && _isMenuOpen)
          FadeInDown(
            child: Container(
              color: Colors.black,
              width: double.infinity,
              padding: EdgeInsets.only(bottom: size.height * 0.03),
              child: Column(
                children: _menuItems
                    .map(
                      (item) => ListTile(
                        title: Text(
                          item['label']!,
                          style: TextStyle(color: metallicGrey),
                        ),
                        onTap: () {
                          setState(() {
                            _currentRoute = item['route']!;
                            _isMenuOpen = false;
                          });
                        },
                      ),
                    )
                    .toList(),
              ),
            ),
          ),
      ],
    );
  }
}

class _NavTextButton extends StatefulWidget {
  final String label;
  final String route;
  final bool isActive;
  final VoidCallback onTap;

  const _NavTextButton({
    required this.label,
    required this.route,
    required this.isActive,
    required this.onTap,
  });

  @override
  State<_NavTextButton> createState() => _NavTextButtonState();
}

class _NavTextButtonState extends State<_NavTextButton> {
  bool _isHovering = false;

  @override
  Widget build(BuildContext context) {
    final Color baseColor = Colors.grey.shade300;
    final Color hoverColor = Colors.grey.shade100;

    return MouseRegion(
      onEnter: (_) => setState(() => _isHovering = true),
      onExit: (_) => setState(() => _isHovering = false),
      child: GestureDetector(
        onTap: widget.onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 300),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            border: Border(
              bottom: BorderSide(
                color:
                    widget.isActive || _isHovering ? baseColor : Colors.transparent,
                width: 2,
              ),
            ),
          ),
          child: AnimatedDefaultTextStyle(
            duration: const Duration(milliseconds: 150),
            style: TextStyle(
              color: _isHovering ? hoverColor : baseColor,
              fontSize: MediaQuery.of(context).size.width * 0.017,
            ),
            child: Text(widget.label),
          ),
        ),
      ),
    );
  }
}
