import 'package:flutter/material.dart';
import 'package:metalwailers/widgets/appbar.dart';

class SobreNosotrosScreen extends StatelessWidget {
  const SobreNosotrosScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;
    final isWide = size.width > 800;

    return Scaffold(
      backgroundColor: Colors.grey.shade100,
      body: Column(
        children: [
          const CustomAppbar(),
          Expanded(
            child: SingleChildScrollView(
              padding: EdgeInsets.symmetric(
                vertical: size.height * 0.04,
                horizontal: isWide ? size.width * 0.15 : size.width * 0.07,
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Sobre Nosotros',
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: Colors.black87,
                        ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'En Metalwilers somos especialistas en el diseño, desarrollo y fabricación de piezas y estructuras metálicas a medida. Contamos con más de 30 años de trayectoria en la industria, brindando soluciones integrales para diversos sectores. Nuestro compromiso con la calidad y la innovación nos ha convertido en un aliado estratégico para empresas que buscan excelencia técnica y cumplimiento en cada proyecto. Disponemos de un equipo altamente calificado y tecnología de vanguardia que nos permite garantizar productos confiables, precisos y adaptados a las necesidades de cada cliente.',
                    style: Theme.of(context).textTheme.bodyLarge,
                    textAlign: TextAlign.justify,
                  ),
                  const SizedBox(height: 32),
                  Text(
                    'Nuestra Misión',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: Colors.black87,
                        ),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Brindar soluciones metalúrgicas innovadoras, eficientes y personalizadas, enfocadas en la calidad, la precisión y la satisfacción de nuestros clientes.',
                    style: Theme.of(context).textTheme.bodyLarge,
                    textAlign: TextAlign.justify,
                  ),
                  const SizedBox(height: 32),
                  Text(
                    '¿Por qué Elegirnos?',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: Colors.black87,
                        ),
                  ),
                  const SizedBox(height: 20),
                  _buildReasonItem(
                    context,
                    title: 'Tecnología de Precisión',
                    description:
                        'Utilizamos maquinaria de última generación que nos permite ofrecer soluciones precisas, seguras y con excelente terminación.',
                  ),
                  _buildReasonItem(
                    context,
                    title: 'Versatilidad y Capacidad',
                    description:
                        'Nos adaptamos a proyectos de distintas escalas, ofreciendo el mismo compromiso y calidad en cada etapa del proceso.',
                  ),
                  _buildReasonItem(
                    context,
                    title: 'Compromiso con la Calidad',
                    description:
                        'Implementamos controles rigurosos en cada fase de producción para asegurar que cada pieza cumpla con las exigencias del cliente y de la industria.',
                  ),
                  _buildReasonItem(
                    context,
                    title: 'Atención Personalizada',
                    description:
                        'Nos involucramos en cada proyecto de forma cercana, brindando un servicio flexible y adaptado a las necesidades específicas de cada cliente.',
                  ),
                  // Sección: Nuestros Clientes
const SizedBox(height: 40),
Text(
  'Nuestros Clientes',
  style: Theme.of(context).textTheme.titleLarge?.copyWith(
        fontWeight: FontWeight.w600,
        color: Colors.black87,
      ),
),
const SizedBox(height: 12),
Text(
  'Colaboramos con pequeñas y grandes empresas que valoran la excelencia técnica y el compromiso. Nuestra experiencia nos permite acompañar proyectos exigentes con soluciones confiables, ágiles y efectivas.',
  style: Theme.of(context).textTheme.bodyLarge,
  textAlign: TextAlign.justify,
),

// Sección: Sectores
const SizedBox(height: 40),
Text(
  'Sectores que Confían en Nosotros',
  style: Theme.of(context).textTheme.titleLarge?.copyWith(
        fontWeight: FontWeight.w600,
        color: Colors.black87,
      ),
),
const SizedBox(height: 12),
Text(
  'Trabajamos con diversos sectores industriales, entre ellos:',
  style: Theme.of(context).textTheme.bodyLarge,
  textAlign: TextAlign.justify,
),
const SizedBox(height: 24),
Column(
  children: _buildSectorCards(),
),


                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}


  Widget _buildReasonItem(
  BuildContext context, {
  required String title,
  required String description,
}) {
  final Map<String, IconData> icons = {
    'Tecnología de Precisión': Icons.precision_manufacturing,
    'Versatilidad y Capacidad': Icons.settings_input_component_outlined,
    'Compromiso con la Calidad': Icons.verified_outlined,
    'Atención Personalizada': Icons.handshake_outlined,
  };

  return _ReasonCard(
    title: title,
    description: description,
    icon: icons[title] ?? Icons.info_outline,
  );
}





class _ReasonCard extends StatefulWidget {
  final String title;
  final String description;
  final IconData icon;

  const _ReasonCard({
    required this.title,
    required this.description,
    required this.icon,
  });

  @override
  State<_ReasonCard> createState() => _ReasonCardState();
}

class _ReasonCardState extends State<_ReasonCard> {
  bool _isHover = false;

  @override
  Widget build(BuildContext context) {
    final Color iconColor = _isHover ? Colors.black : Colors.grey.shade700;
    final Color textColor = _isHover ? Colors.black : Colors.grey.shade800;

    return MouseRegion(
      onEnter: (_) => setState(() => _isHover = true),
      onExit: (_) => setState(() => _isHover = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.all(16),
        margin: const EdgeInsets.only(bottom: 20),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(12),
          boxShadow: _isHover
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
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                          color: textColor,
                        ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    widget.description,
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: textColor,
                        ),
                    textAlign: TextAlign.justify,
                  ),
                ],
              ),
            )
          ],
        ),
      ),
    );
  }
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

  return sectors
      .map((sector) => _SectorCard(
            label: sector['label'] as String,
            icon: sector['icon'] as IconData,
          ))
      .toList();
}

class _SectorCard extends StatefulWidget {
  final String label;
  final IconData icon;

  const _SectorCard({required this.label, required this.icon});

  @override
  State<_SectorCard> createState() => _SectorCardState();
}

class _SectorCardState extends State<_SectorCard> {
  bool _isHover = false;

  @override
  Widget build(BuildContext context) {
    final Color color = _isHover ? Colors.black : Colors.grey.shade700;

    return MouseRegion(
      onEnter: (_) => setState(() => _isHover = true),
      onExit: (_) => setState(() => _isHover = false),
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(10),
          boxShadow: _isHover
              ? [BoxShadow(color: Colors.black26, blurRadius: 8, offset: Offset(0, 4))]
              : [],
        ),
        child: Row(
          children: [
            Icon(widget.icon, color: color, size: 24),
            const SizedBox(width: 12),
            Expanded(
              child: Text(
                widget.label,
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.w500,
                  color: color,
                ),
              ),
            )
          ],
        ),
      ),
    );
  }
}

