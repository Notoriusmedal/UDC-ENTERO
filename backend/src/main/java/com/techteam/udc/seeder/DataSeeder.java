package com.techteam.udc.seeder;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

import com.techteam.udc.models.AsignacionArbitral;
import com.techteam.udc.models.Equipo;
import com.techteam.udc.models.EstadoPartido;
import com.techteam.udc.models.Instalacion;
import com.techteam.udc.models.Notificacion;
import com.techteam.udc.models.Partido;
import com.techteam.udc.models.Rol;
import com.techteam.udc.models.TipoNotificacion;
import com.techteam.udc.models.Usuario;
import com.techteam.udc.repositories.AsignacionArbitralRepository;
import com.techteam.udc.repositories.EquipoRepository;
import com.techteam.udc.repositories.InstalacionRepository;
import com.techteam.udc.repositories.NotificacionRepository;
import com.techteam.udc.repositories.PartidoRepository;
import com.techteam.udc.repositories.UsuarioRepository;

import org.springframework.boot.CommandLineRunner;

// Corre al arrancar si udc.bootstrap.dev-users=true; inserta admin demo si la tabla usuario esta vacia
@Component
@ConditionalOnProperty(name = "udc.bootstrap.dev-users", havingValue = "true")
public class DataSeeder implements CommandLineRunner {

	private final UsuarioRepository UR;
	private final EquipoRepository ER;
	private final InstalacionRepository IR;
	private final PartidoRepository PR;
	private final AsignacionArbitralRepository AR;
	private final NotificacionRepository NR;
	private final PasswordEncoder PE;

	@Value("${udc.bootstrap.admin.username}")
	private String adminUsername;

	@Value("${udc.bootstrap.admin.password}")
	private String adminPassword;

	public DataSeeder(UsuarioRepository usuarioRepository,
			EquipoRepository equipoRepository,
			InstalacionRepository instalacionRepository,
			PartidoRepository partidoRepository,
			AsignacionArbitralRepository asignacionArbitralRepository,
			NotificacionRepository notificacionRepository,
			@Qualifier("miPEcontraseñaApp") PasswordEncoder passwordEncoder) {
		this.UR = usuarioRepository;
		this.ER = equipoRepository;
		this.IR = instalacionRepository;
		this.PR = partidoRepository;
		this.AR = asignacionArbitralRepository;
		this.NR = notificacionRepository;
		this.PE = passwordEncoder;
	}

	@Override
	public void run(String... args) {
		seedUsuariosDemo();
		seedCatalogoYPartidosDemo();
	}

	private void seedUsuariosDemo() {
		crearUsuarioSiNoExiste(adminUsername.trim(), adminPassword, "Administrador", "Sistema",
				adminUsername.trim().toLowerCase() + "@udc.dev", "00000000A", "000000000",
				Rol.ADMIN, false, null, null, null);

		crearUsuarioSiNoExiste("organizador", "1234", "Laura", "Martín",
				"organizador@udc.dev", "00000001B", "600000001",
				Rol.ORGANIZADOR, false, null, null, null);

		crearUsuarioSiNoExiste("organizador2", "1234", "Marta", "Santana",
				"organizador2@udc.dev", "00000007H", "600000007",
				Rol.ORGANIZADOR, false, null, null, null);

		crearUsuarioSiNoExiste("coordinador", "1234", "Carlos", "Pérez",
				"coordinador@udc.dev", "00000002C", "600000002",
				Rol.COORDINADOR_ARBITROS, false, null, null, null);

		crearUsuarioSiNoExiste("espectador", "1234", "Nayra", "Ramos",
				"espectador@udc.dev", "00000006G", "600000006",
				Rol.ESPECTADOR, false, null, null, null);

		crearUsuarioSiNoExiste("aficionado", "1234", "Iker", "Marrero",
				"aficionado@udc.dev", "00000008J", "600000008",
				Rol.ESPECTADOR, false, null, null, null);

		crearUsuarioSiNoExiste("arbitro", "1234", "Miguel", "González",
				"arbitro@udc.dev", "00000003D", "600000003",
				Rol.ARBITRO, true, "REGIONAL", "UDC-ARB-001", "FUTBOL,BALONMANO");

		crearUsuarioSiNoExiste("arbitro2", "1234", "Sara", "Rodríguez",
				"arbitro2@udc.dev", "00000004E", "600000004",
				Rol.ARBITRO, true, "NACIONAL", "UDC-ARB-002", "FUTBOL,BALONCESTO");

		crearUsuarioSiNoExiste("arbitro3", "1234", "Diego", "Suárez",
				"arbitro3@udc.dev", "00000005F", "600000005",
				Rol.ARBITRO, true, "PROVINCIAL", "UDC-ARB-003", "FUTBOL,VOLEIBOL");

		crearUsuarioSiNoExiste("arbitro4", "1234", "Elena", "Morales",
				"arbitro4@udc.dev", "00000009K", "600000009",
				Rol.ARBITRO, true, "REGIONAL", "UDC-ARB-004", "BALONCESTO,VOLEIBOL");

		crearUsuarioSiNoExiste("arbitro5", "1234", "Pablo", "Hernández",
				"arbitro5@udc.dev", "00000010L", "600000010",
				Rol.ARBITRO, true, "LOCAL", "UDC-ARB-005", "BALONMANO,FUTBOL");

		crearUsuarioSiNoExiste("arbitro6", "1234", "Alba", "Medina",
				"arbitro6@udc.dev", "00000011M", "600000011",
				Rol.ARBITRO, true, "NACIONAL", "UDC-ARB-006", "BALONCESTO,FUTBOL,VOLEIBOL");
	}

	private void seedCatalogoYPartidosDemo() {
		Equipo udcNorte = equipo("UDC Norte", "UDC NORTE");
		Equipo udcSur = equipo("UDC Sur", "UDC SUR");
		Equipo cdTeide = equipo("CD Teide", "TEIDE");
		Equipo atlantico = equipo("Atlántico FC", "ATLANTICO");
		Equipo cbLaguna = equipo("CB Laguna", "LAGUNA");
		Equipo granCanaria = equipo("Gran Canaria B", "GCB");
		Equipo aronaVoley = equipo("Arona Voley", "ARONA");
		Equipo teldeVc = equipo("Telde VC", "TELDE");
		Equipo costaAdeje = equipo("Costa Adeje Handball", "ADEJE");
		Equipo lanzaroteArena = equipo("Lanzarote Arena", "LANZAROTE");
		Equipo fuerteventura = equipo("Fuerteventura Sport", "FUERTE");
		Equipo unionLaPalma = equipo("Unión La Palma", "PALMA");

		Instalacion pabellonCentral = instalacion("Pabellón Central", "Santa Cruz de Tenerife", 28.4636, -16.2518);
		Instalacion campoInsular = instalacion("Campo Insular", "La Laguna", 28.4874, -16.3159);
		Instalacion ciudadDeportiva = instalacion("Ciudad Deportiva Gran Canaria", "Las Palmas de Gran Canaria",
				28.1248, -15.4300);
		Instalacion pabellonArona = instalacion("Pabellón Municipal de Arona", "Arona", 28.0996, -16.6810);
		Instalacion pabellonTelde = instalacion("Pabellón Juan Carlos Hernández", "Telde", 27.9955, -15.4163);
		Instalacion pabellonLanzarote = instalacion("Pabellón Insular de Lanzarote", "Arrecife", 28.9630, -13.5477);
		Instalacion estadioLaPalma = instalacion("Estadio Los Llanos", "La Palma", 28.6585, -17.9182);

		Usuario organizador = UR.findByUsername("organizador").orElseThrow();
		Usuario organizador2 = UR.findByUsername("organizador2").orElseThrow();
		LocalDateTime base = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);

		Partido partidoDestacado = partido(udcNorte, udcSur, pabellonCentral, organizador,
				base.plusDays(2).withHour(18).withMinute(30), null, EstadoPartido.PROGRAMADO, 3,
				"FUTBOL", "Liga Insular", "Partido destacado para la demo principal.");
		Partido baloncesto = partido(cbLaguna, granCanaria, ciudadDeportiva, organizador2,
				base.plusDays(2).withHour(20).withMinute(0), null, EstadoPartido.PROGRAMADO, 2,
				"BALONCESTO", "Senior femenino", "Derbi regional de baloncesto.");
		Partido voleibol = partido(aronaVoley, teldeVc, pabellonArona, organizador,
				base.plusDays(3).withHour(12).withMinute(0), null, EstadoPartido.PROGRAMADO, 2,
				"VOLEIBOL", "Juvenil", "Necesita completar cobertura arbitral.");
		Partido balonmano = partido(costaAdeje, lanzaroteArena, pabellonLanzarote, organizador2,
				base.plusDays(4).withHour(17).withMinute(30), null, EstadoPartido.CANCHA_ACTIVA, 2,
				"BALONMANO", "Copa Canaria", "Cancha activa pendiente de asignación final.");
		Partido preferente = partido(cdTeide, atlantico, campoInsular, organizador,
				base.plusDays(5).withHour(19).withMinute(0), null, EstadoPartido.PROGRAMADO, 3,
				"FUTBOL", "Preferente", "Encuentro con alta afluencia prevista.");
		Partido interinsular = partido(fuerteventura, unionLaPalma, estadioLaPalma, organizador2,
				base.plusDays(6).withHour(11).withMinute(0), null, EstadoPartido.PROGRAMADO, 3,
				"FUTBOL", "Liga Regional", "Desplazamiento interinsular coordinado.");
		Partido enDirecto = partido(udcSur, cdTeide, campoInsular, organizador,
				LocalDateTime.now().minusMinutes(35).withSecond(0).withNano(0),
				LocalDateTime.now().plusMinutes(55).withSecond(0).withNano(0), EstadoPartido.EN_CURSO, 3,
				"FUTBOL", "Torneo Primavera", "Partido en curso para mostrar estados vivos.");
		Partido resultadoBasket = partido(granCanaria, cbLaguna, ciudadDeportiva, organizador2,
				base.minusDays(1).withHour(20).withMinute(0), base.minusDays(1).withHour(21).withMinute(35),
				EstadoPartido.FINALIZADO, 2,
				"BALONCESTO", "Senior femenino", "Resultado demo: 68 - 64.");
		Partido resultadoVoley = partido(teldeVc, aronaVoley, pabellonTelde, organizador,
				base.minusDays(2).withHour(18).withMinute(0), base.minusDays(2).withHour(19).withMinute(45),
				EstadoPartido.FINALIZADO, 2,
				"VOLEIBOL", "Juvenil", "Resultado demo: 3 - 2.");
		Partido cancelado = partido(unionLaPalma, lanzaroteArena, estadioLaPalma, organizador2,
				base.plusDays(1).withHour(16).withMinute(30), null, EstadoPartido.CANCELADO, 2,
				"FUTBOL", "Amistoso Interinsular", "Cancelado por meteorología.");

		seedAsignacionesYNotificacionesDemo(
				partidoDestacado,
				baloncesto,
				voleibol,
				balonmano,
				preferente,
				interinsular,
				enDirecto,
				resultadoBasket,
				resultadoVoley,
				cancelado);
	}

	private void crearUsuarioSiNoExiste(String username, String password, String nombre, String apellidos,
			String correo, String documento, String telefono, Rol rol, boolean convocable,
			String categoria, String licencia, String competencias) {
		if (UR.existsByUsername(username)) {
			return;
		}
		Usuario usuario = new Usuario(
				username,
				PE.encode(password),
				nombre,
				apellidos,
				correo,
				documento,
				telefono,
				rol,
				true,
				rol == Rol.ARBITRO && convocable);
		if (rol == Rol.ARBITRO) {
			usuario.setCategoriaArbitral(categoria != null ? categoria : "LOCAL");
			usuario.setLicenciaArbitral(licencia);
			usuario.setDisponibilidadArbitral("DISPONIBLE");
			usuario.setCompetenciasArbitrales(competencias != null ? competencias : "FUTBOL");
			usuario.setObservacionesArbitro("Perfil demo preparado para la presentación.");
		}
		UR.save(usuario);
	}

	private Equipo equipo(String nombre, String etiqueta) {
		return ER.findByNombreIgnoreCase(nombre)
				.orElseGet(() -> ER.save(new Equipo(nombre, etiqueta)));
	}

	private Instalacion instalacion(String nombre, String ubicacion, Double latitud, Double longitud) {
		return IR.findFirstByNombreIgnoreCase(nombre)
				.orElseGet(() -> IR.save(new Instalacion(nombre, ubicacion, latitud, longitud)));
	}

	private Partido partido(Equipo local, Equipo visitante, Instalacion instalacion, Usuario organizador,
			LocalDateTime inicio, LocalDateTime fin, EstadoPartido estado, int arbitrosRequeridos,
			String deporte, String competicion, String observaciones) {
		return PR.findAll().stream()
				.filter(p -> p.getEquipoLocal().getId().equals(local.getId()))
				.filter(p -> p.getEquipoVisitante().getId().equals(visitante.getId()))
				.filter(p -> p.getCompeticion() != null && p.getCompeticion().equalsIgnoreCase(competicion))
				.findFirst()
				.orElseGet(() -> {
					Partido nuevo = new Partido(
							local,
							visitante,
							instalacion,
							organizador,
							inicio,
							fin,
							estado,
							arbitrosRequeridos);
					nuevo.setDeporte(deporte);
					nuevo.setCompeticion(competicion);
					nuevo.setObservaciones(observaciones);
					return PR.save(nuevo);
				});
	}

	private void seedAsignacionesYNotificacionesDemo(Partido partidoDestacado,
			Partido baloncesto,
			Partido voleibol,
			Partido balonmano,
			Partido preferente,
			Partido interinsular,
			Partido enDirecto,
			Partido resultadoBasket,
			Partido resultadoVoley,
			Partido cancelado) {
		Usuario admin = UR.findByUsername(adminUsername.trim()).orElseThrow();
		Usuario coordinador = UR.findByUsername("coordinador").orElseThrow();
		Usuario arbitro1 = UR.findByUsername("arbitro").orElseThrow();
		Usuario arbitro2 = UR.findByUsername("arbitro2").orElseThrow();
		Usuario arbitro3 = UR.findByUsername("arbitro3").orElseThrow();
		Usuario arbitro4 = UR.findByUsername("arbitro4").orElseThrow();
		Usuario arbitro5 = UR.findByUsername("arbitro5").orElseThrow();
		Usuario arbitro6 = UR.findByUsername("arbitro6").orElseThrow();

		asignar(partidoDestacado, arbitro1, "Principal", "CONFIRMADO", coordinador,
				"Confirmado para el partido destacado.");
		asignar(partidoDestacado, arbitro2, "Asistente 1", "CONFIRMADO", coordinador, null);
		asignar(partidoDestacado, arbitro3, "Asistente 2", "PENDIENTE", coordinador,
				"Pendiente de confirmar asistencia.");

		asignar(baloncesto, arbitro4, "Principal", "CONFIRMADO", coordinador, null);
		asignar(baloncesto, arbitro6, "Auxiliar", "PENDIENTE", coordinador, null);

		asignar(voleibol, arbitro3, "Principal", "PENDIENTE", coordinador,
				"Falta segundo árbitro para completar cobertura.");

		asignar(preferente, arbitro1, "Principal", "CONFIRMADO", coordinador, null);
		asignar(preferente, arbitro5, "Asistente 1", "PENDIENTE", coordinador, null);

		asignar(interinsular, arbitro2, "Principal", "PENDIENTE", coordinador,
				"Pendiente de viaje interinsular.");

		asignar(enDirecto, arbitro1, "Principal", "CONFIRMADO", coordinador, null);
		asignar(enDirecto, arbitro2, "Asistente 1", "CONFIRMADO", coordinador, null);
		asignar(enDirecto, arbitro5, "Asistente 2", "CONFIRMADO", coordinador, null);

		asignar(resultadoBasket, arbitro4, "Principal", "CONFIRMADO", coordinador, null);
		asignar(resultadoBasket, arbitro6, "Auxiliar", "CONFIRMADO", coordinador, null);

		asignar(resultadoVoley, arbitro3, "Principal", "CONFIRMADO", coordinador, null);
		asignar(resultadoVoley, arbitro6, "Auxiliar", "CONFIRMADO", coordinador, null);

		notificar(admin, TipoNotificacion.AVISO_SISTEMA, "Demo lista para presentar",
				"Se han cargado usuarios, equipos, partidos, asignaciones y resultados de muestra.", null, false);
		notificar(coordinador, TipoNotificacion.CANCHA_PARA_COORDINACION_ARBITRAL,
				"Cobertura pendiente en Copa Canaria",
				"Costa Adeje Handball vs Lanzarote Arena necesita 2 árbitros.", balonmano, false);
		notificar(coordinador, TipoNotificacion.ASIGNACION_ARBITRAL,
				"Voleibol juvenil incompleto",
				"Arona Voley vs Telde VC tiene 1 de 2 árbitros asignados.", voleibol, false);
		notificar(arbitro3, TipoNotificacion.ASIGNACION_ARBITRAL,
				"Asignación pendiente de confirmar",
				"Tienes una asignación pendiente para UDC Norte vs UDC Sur.", partidoDestacado, false);
		notificar(arbitro6, TipoNotificacion.ASIGNACION_ARBITRAL,
				"Nueva asignación de baloncesto",
				"Revisa tu asignación para CB Laguna vs Gran Canaria B.", baloncesto, false);
		notificar(admin, TipoNotificacion.AVISO_SISTEMA,
				"Partido cancelado registrado",
				"Unión La Palma vs Lanzarote Arena figura como cancelado por meteorología.", cancelado, true);
	}

	private void asignar(Partido partido, Usuario arbitro, String posicion, String estado, Usuario asignadoPor,
			String observaciones) {
		if (AR.existsByArbitroAndPartido_IdAndRevocadaFalse(arbitro, partido.getId())) {
			return;
		}
		AsignacionArbitral asignacion = new AsignacionArbitral(partido, arbitro, posicion, asignadoPor);
		asignacion.setEstado(estado);
		asignacion.setObservaciones(observaciones);
		AR.save(asignacion);
	}

	private void notificar(Usuario destinatario, TipoNotificacion tipo, String titulo, String mensaje, Partido partido,
			boolean leida) {
		boolean existe = NR.findByDestinatario_IdOrderByCreadoEnDesc(destinatario.getId()).stream()
				.anyMatch(n -> n.getTitulo().equalsIgnoreCase(titulo));
		if (existe) {
			return;
		}
		Notificacion notificacion = new Notificacion(destinatario, tipo, titulo, mensaje, partido);
		notificacion.setLeida(leida);
		NR.save(notificacion);
	}
}
