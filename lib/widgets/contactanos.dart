import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:font_awesome_flutter/font_awesome_flutter.dart';
import 'package:http/http.dart' as http;

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
  const fromEmail = 'soporte@assistify.lat';
  const adminEmail = 'manunv97@gmail.com';

  final subjectAdmin = 'Nueva consulta de $nombre';
  final contentAdmin = '''
Nombre/Empresa: $nombre
Email: $email
Teléfono: $telefono
Servicio: $servicio
Rubro: $rubro
Comentarios: $comentarios
''';

  final subjectUser = 'Hemos recibido tu consulta';
  final contentUser = '''
Hola $nombre,

Gracias por contactarte con Metalwailers. Hemos recibido tu consulta sobre "$servicio" y nos estaremos comunicando a la brevedad.

Saludos cordiales,
El equipo de Metalwailers
''';

  final url = Uri.parse('https://api.sendgrid.com/v3/mail/send');

  final headers = {
    'Authorization': dotenv.env['SENDGRID_API_KEY'] ?? "",
    'Content-Type': 'application/json',
  };

  final adminEmailBody = {
    'personalizations': [
      {
        'to': [
          {'email': adminEmail}
        ],
        'subject': subjectAdmin,
      }
    ],
    'from': {'email': fromEmail},
    'content': [
      {'type': 'text/plain', 'value': contentAdmin}
    ],
  };

  final userEmailBody = {
    'personalizations': [
      {
        'to': [
          {'email': email}
        ],
        'subject': subjectUser,
      }
    ],
    'from': {'email': fromEmail},
    'content': [
      {'type': 'text/plain', 'value': contentUser}
    ],
  };

  try {
    final adminResponse = await http.post(
      url,
      headers: headers,
      body: jsonEncode(adminEmailBody),
    );

    final userResponse = await http.post(
      url,
      headers: headers,
      body: jsonEncode(userEmailBody),
    );

    if (adminResponse.statusCode == 202 && userResponse.statusCode == 202) {
      print('Correos enviados exitosamente');
    } else {
      print('Error al enviar correos: ${adminResponse.body}, ${userResponse.body}');
    }
  } catch (e) {
    print('Excepción al enviar correos: $e');
  }
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
      ['Teléfonos', '11 62913437\n11 59628757', FontAwesomeIcons.phone],
      ['Email', 'contactanos@metalwailers.com', FontAwesomeIcons.envelope],
      [
        'Dirección',
        'GORRITI 1399, EL TALAR, TIGRE, PROV. BS.AS.',
        FontAwesomeIcons.locationDot,
      ],
      [
        'Horario',
        'Lunes — Viernes 11 am – 19 pm\nSábado — 10 am – 16 pm\nDomingo — Cerrado',
        FontAwesomeIcons.clock,
      ],
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 50),
        const Text(
          'Contáctanos',
          style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 24),
        ...items.map(
          (item) => _InfoCard(
            title: item[0] as String,
            subtitle: item[1] as String,
            icon: item[2] as IconData,
          ),
        ),
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

  String? selectedServicio;

  return StatefulBuilder(
    builder: (context, setState) => Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const SizedBox(height: 50),
        const Text(
          'Hablemos de tu Proyecto',
          style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        const Text(
          "¿Tenés una idea o necesitás una solución concreta? Te ayudamos a llevarla a cabo",
          textAlign: TextAlign.justify,
          style: TextStyle(fontSize: 16, color: Color.fromARGB(255, 69, 69, 69)),
        ),
        const SizedBox(height: 24),
        Form(
          key: _formKey,
          child: Column(
            children: [
              _inputField(controller: _nameController, label: 'Nombre y Apellido / Empresa'),
              const SizedBox(height: 16),
              _inputField(
                controller: _emailController,
                label: 'Correo Electrónico',
                keyboardType: TextInputType.emailAddress,
                validator: (value) {
                  final emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
                  if (value == null || value.isEmpty) return 'Este campo es requerido';
                  if (!emailRegex.hasMatch(value)) return 'Formato de email inválido';
                  return null;
                },
              ),
              const SizedBox(height: 16),
              TextFormField(
  controller: _phoneController,
  decoration: InputDecoration(
    labelText: 'Teléfono de contacto',
    border: OutlineInputBorder(),
  ),
  keyboardType: TextInputType.phone,
  validator: (value) {
    final phoneRegex = RegExp(r'^[\d\s\-\+\(\)]+$');
    if (value == null || value.isEmpty) {
      return 'Este campo es requerido';
    } else if (!phoneRegex.hasMatch(value)) {
      return 'Ingrese un número de teléfono válido';
    }
    return null;
  },
),

              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                decoration: InputDecoration(
                  labelText: '¿Qué servicio estás buscando?',
                  border: const OutlineInputBorder(),
                  enabledBorder: OutlineInputBorder(
                    borderSide: BorderSide(color: Colors.grey.shade400),
                  ),
                  focusedBorder: const OutlineInputBorder(
                    borderSide: BorderSide(color: Colors.black),
                  ),
                ),
                value: selectedServicio,
                onChanged: (value) => setState(() => selectedServicio = value),
                validator: (value) =>
                    value == null || value.isEmpty ? 'Este campo es requerido' : null,
                items: servicios.map((service) {
                  return DropdownMenuItem(
                    value: service,
                    child: Text(service),
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),
              _inputField(label: 'Rubro o industria de tu proyecto'),
              const SizedBox(height: 16),
              _inputField(
                label: 'Comentarios / Consulta específica',
                maxLines: 5,
              ),
              const SizedBox(height: 24),
              MouseRegion(
                onEnter: (_) => setState(() => _isHovering = true),
                onExit: (_) => setState(() => _isHovering = false),
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 200),
                  curve: Curves.easeInOut,
                  decoration: BoxDecoration(
                    color: _isHovering ? Colors.black : Colors.grey.shade400,
                    borderRadius: BorderRadius.circular(10),
                  ),
                  child: SizedBox(
                    width: double.infinity,
                    child: ElevatedButton(
                      onPressed: () {
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
        content: Text(
          'Gracias por contactarte con Metalwailers. Te responderemos a la brevedad',
          style: TextStyle(color: Colors.white),
        ),
      ),
    );
  }
},

                      style: ElevatedButton.styleFrom(
                        backgroundColor: Colors.grey.shade400,
                        foregroundColor: Colors.black,
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(10),
                        ),
                      ).copyWith(
                        overlayColor: WidgetStateProperty.resolveWith(
                          (states) => states.contains(WidgetState.hovered) ? Colors.black : null,
                        ),
                        foregroundColor: WidgetStateProperty.resolveWith(
                          (states) => states.contains(WidgetState.hovered) ? Colors.white : Colors.black,
                        ),
                      ),
                      child: const Text(
                        'Enviar consulta',
                        style: TextStyle(fontWeight: FontWeight.bold),
                      ),
                    ),
                  ),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 50),
      ],
    ),
  );
}

}

Widget _inputField({
  TextEditingController? controller,
  required String label,
  TextInputType keyboardType = TextInputType.text,
  int maxLines = 1,
  String? Function(String?)? validator,
}) {
  return TextFormField(
    controller: controller,
    keyboardType: keyboardType,
    maxLines: maxLines,
    decoration: InputDecoration(
      labelText: label,
      labelStyle: const TextStyle(color: Colors.black),
      border: const OutlineInputBorder(),
      enabledBorder: OutlineInputBorder(
        borderSide: BorderSide(color: Colors.grey.shade400),
      ),
      focusedBorder: const OutlineInputBorder(
        borderSide: BorderSide(color: Colors.black),
      ),
    ),
    validator: validator ?? (value) => (value == null || value.isEmpty) ? 'Este campo es requerido' : null,
  );
}


class _InfoCard extends StatefulWidget {
  final String title;
  final String subtitle;
  final IconData icon;

  const _InfoCard({
    required this.title,
    required this.subtitle,
    required this.icon,
  });

  @override
  State<_InfoCard> createState() => _InfoCardState();
}

class _InfoCardState extends State<_InfoCard> {
  bool _isHover = false;

  @override
  Widget build(BuildContext context) {
    final iconColor = _isHover ? Colors.black : Colors.grey.shade700;
    final textColor = _isHover ? Colors.black : Colors.grey.shade800;

    return MouseRegion(
      onEnter: (_) => setState(() => _isHover = true),
      onExit: (_) => setState(() => _isHover = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.only(bottom: 24),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(12),
          color: Colors.white,
          boxShadow:
              _isHover
                  ? [
                    BoxShadow(
                      color: Colors.black26,
                      blurRadius: 10,
                      offset: const Offset(0, 6),
                    ),
                  ]
                  : [],
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(widget.icon, color: iconColor, size: 28),
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
                      color: textColor,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    widget.subtitle,
                    style: TextStyle(fontSize: 14, color: textColor),
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
