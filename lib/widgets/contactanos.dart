
// 👇 Asegurate de eliminar imports innecesarios
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:http/http.dart' as http;
import 'package:metalwailers/widgets/animated_button.dart';
import 'package:url_launcher/url_launcher.dart';


class Contactanos extends StatefulWidget {
  const Contactanos({super.key});

  @override
  State<Contactanos> createState() => _ContactanosState();
}

class _ContactanosState extends State<Contactanos> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _nameController = TextEditingController();
  final _phoneController = TextEditingController();
  final _rubroController = TextEditingController();
  final _comentariosController = TextEditingController();
  String? selectedServicio;
  bool _isHovering = false;

  @override
  void dispose() {
    _emailController.dispose();
    _nameController.dispose();
    _phoneController.dispose();
    _rubroController.dispose();
    _comentariosController.dispose();
    super.dispose();
  }

  Future<void> sendEmails({
    required String nombre,
    required String email,
    required String telefono,
    required String servicio,
    required String rubro,
    required String comentarios,
  }) async {
    final functionUrl = Uri.parse('https://assistify-token-generator-1014.twil.io/send-email');
    final headers = {'Content-Type': 'application/json'};

    await http.post(functionUrl, headers: headers, body: jsonEncode({
      'to': 'manunv97@gmail.com',
      'subject': 'Nueva consulta de $nombre',
      'text': 'Nombre/Empresa: $nombre\nEmail: $email\nTeléfono: $telefono\nServicio: $servicio\nRubro: $rubro\nComentarios: $comentarios',
    }));

    await http.post(functionUrl, headers: headers, body: jsonEncode({
      'to': email,
      'subject': 'Hemos recibido tu consulta',
      'text': 'Hola $nombre,\n\nGracias por contactarte con Metalwailers. Hemos recibido tu consulta sobre "$servicio" y nos estaremos comunicando a la brevedad.\n\nSaludos cordiales,\nEl equipo de Metalwailers',
    }));
  }

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isWide = size.width > 800;

    return isWide
        ? Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(child: _leftColumn()),
              const SizedBox(width: 40),
              Expanded(child: _rightColumn()),
            ],
          )
        : Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _leftColumn(),
              const SizedBox(height: 32),
              _rightColumn(),
            ],
          );
  }

  Widget _leftColumn() {
  final items = [
    ['Teléfonos', '11 62913437\n11 59628757', FontAwesomeIcons.phone, 'https://wa.me/5491162913437'],
    ['Email', 'contactanos@metalwailers.com', FontAwesomeIcons.envelope, 'mailto:contactanos@metalwailers.com'],
    ['Dirección', 'GORRITI 1399, EL TALAR, TIGRE, PROV. BS.AS.', FontAwesomeIcons.locationDot, 'https://www.google.com/maps/place/GORRITI+1399,+El+Talar'],
    ['Instagram', '@metalwailers', FontAwesomeIcons.instagram, 'https://www.instagram.com/metalwailers'],
  ];

  return Column(
    crossAxisAlignment: CrossAxisAlignment.start,
    children: [
      const SizedBox(height: 50),
      const Text(
        'Contáctanos',
        style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white),
      ),
      const SizedBox(height: 24),
      ...items.map((item) => _InfoCard(
            title: item[0] as String,
            subtitle: item[1] as String,
            icon: item[2] as IconData,
            url: item[3] as String,
          )),
      const SizedBox(height: 50),
    ],
  );
}


  Widget _rightColumn() {
    final servicios = [
      'Asesoría y diseño',
      'Corte Láser CNC',
      'Corte Plasma CNC',
      'Soldadura',
      'Plegado / Curvado / Cilindrado',
      'Punzonado',
      'Balancinado',
      'Pintura a horno',
      'Solución metalúrgica integral',
    ];

    return StatefulBuilder(
      builder: (context, setState) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: 50),
          const Text('Hablemos de tu Proyecto', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white)),
          const SizedBox(height: 8),
          const Text("¿Tenés una idea o necesitás una solución concreta? Te ayudamos a llevarla a cabo", textAlign: TextAlign.justify, style: TextStyle(fontSize: 16, color: Colors.white70)),
          const SizedBox(height: 24),
          Form(
            key: _formKey,
            child: Column(
              children: [
                _inputField(controller: _nameController, label: 'Nombre y Apellido / Empresa'),
                const SizedBox(height: 16),
                _inputField(controller: _emailController, label: 'Correo Electrónico', keyboardType: TextInputType.emailAddress),
                const SizedBox(height: 16),
                _inputField(controller: _phoneController, label: 'Teléfono de contacto', keyboardType: TextInputType.phone),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  value: selectedServicio,
                  dropdownColor: Colors.grey[900],
                  iconEnabledColor: Colors.white70,
                  style: const TextStyle(color: Colors.white),
                  decoration: InputDecoration(
                    labelText: '¿Qué servicio estás buscando?',
                    labelStyle: const TextStyle(color: Colors.white70),
                    border: const OutlineInputBorder(),
                    enabledBorder: OutlineInputBorder(borderSide: BorderSide(color: Colors.white24)),
                    focusedBorder: const OutlineInputBorder(borderSide: BorderSide(color: Colors.white)),
                  ),
                  onChanged: (value) => setState(() => selectedServicio = value),
                  validator: (value) => value == null || value.isEmpty ? 'Este campo es requerido' : null,
                  items: servicios.map((service) => DropdownMenuItem(value: service, child: Text(service))).toList(),
                ),
                const SizedBox(height: 16),
                _inputField(controller: _rubroController, label: 'Rubro o industria de tu proyecto'),
                const SizedBox(height: 16),
                _inputField(controller: _comentariosController, label: 'Comentarios / Consulta específica', maxLines: 5),
                const SizedBox(height: 24),
                HoverAnimatedButton(onPressed: () {
                      if (_formKey.currentState!.validate()) {
                        sendEmails(
                          nombre: _nameController.text,
                          email: _emailController.text,
                          telefono: _phoneController.text,
                          servicio: selectedServicio!,
                          rubro: _rubroController.text,
                          comentarios: _comentariosController.text,
                        );
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(
                            backgroundColor: Colors.black,
                            duration: Duration(seconds: 6),
                            content: Text('Gracias por contactarte con Metalwailers. Te responderemos a la brevedad', style: TextStyle(color: Colors.white)),
                          ),
                        );
                      }
                    },
                    text: "Enviar consulta"),
              ],
            ),
          ),
          const SizedBox(height: 50),
        ],
      ),
    );
  }

  Widget _inputField({
    required TextEditingController controller,
    required String label,
    TextInputType keyboardType = TextInputType.text,
    int maxLines = 1,
    String? Function(String?)? validator,
  }) {
    return TextFormField(
      controller: controller,
      keyboardType: keyboardType,
      maxLines: maxLines,
      style: const TextStyle(color: Colors.white),
      decoration: InputDecoration(
        labelText: label,
        labelStyle: const TextStyle(color: Colors.white70),
        border: const OutlineInputBorder(),
        enabledBorder: OutlineInputBorder(borderSide: BorderSide(color: Colors.white24)),
        focusedBorder: const OutlineInputBorder(borderSide: BorderSide(color: Colors.white)),
      ),
      validator: validator ?? (value) => (value == null || value.isEmpty) ? 'Este campo es requerido' : null,
    );
  }
}

class _InfoCard extends StatefulWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final String url;

  const _InfoCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.url,
  });

  @override
  State<_InfoCard> createState() => _InfoCardState();
}

class _InfoCardState extends State<_InfoCard> {
  bool _isHover = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      cursor: SystemMouseCursors.click,
      onEnter: (_) => setState(() => _isHover = true),
      onExit: (_) => setState(() => _isHover = false),
      child: GestureDetector(
        onTap: () => launchUrl(Uri.parse(widget.url)),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 200),
          margin: const EdgeInsets.only(bottom: 24),
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(12),
            color: _isHover ? Colors.grey.shade800 : Colors.grey.shade900,
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Icon(widget.icon, color: _isHover ? Colors.white : Colors.white70, size: 28),
              const SizedBox(width: 16),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.title,
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                        color: _isHover ? Colors.white : Colors.white,
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      widget.subtitle,
                      style: TextStyle(
                        fontSize: 14,
                        color: _isHover ? Colors.white : Colors.white70,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
