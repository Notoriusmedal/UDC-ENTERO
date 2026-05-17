package com.techteam.udc.models;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "partido")
public class Partido {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(optional = false, fetch = FetchType.LAZY)
	@JoinColumn(name = "equipo_local_id")
	private Equipo equipoLocal;

	@ManyToOne(optional = false, fetch = FetchType.LAZY)
	@JoinColumn(name = "equipo_visitante_id")
	private Equipo equipoVisitante;

	@ManyToOne(optional = false, fetch = FetchType.LAZY)
	@JoinColumn(name = "instalacion_id")
	private Instalacion instalacion;

	@ManyToOne(optional = false, fetch = FetchType.LAZY)
	@JoinColumn(name = "organizador_id")
	private Usuario organizador;

	@Column(nullable = false)
	private LocalDateTime fechaInicio;

	// Si es null las reglas de solape usan fechaInicio + 2 horas como fin efectivo
	private LocalDateTime fechaFin;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 32)
	private EstadoPartido estado = EstadoPartido.PROGRAMADO;

	@Column(nullable = false)
	private int plazasArbitralesSolicitadas = 3;

	@Column(nullable = false, length = 40)
	private String deporte = "FUTBOL";

	@Column(length = 160)
	private String competicion;

	@Column(length = 1000)
	private String observaciones;

	protected Partido() {
	}

	public Partido(
			Equipo equipoLocal,
			Equipo equipoVisitante,
			Instalacion instalacion,
			Usuario organizador,
			LocalDateTime fechaInicio,
			LocalDateTime fechaFin,
			EstadoPartido estado,
			int plazasArbitralesSolicitadas) {
		this.equipoLocal = equipoLocal;
		this.equipoVisitante = equipoVisitante;
		this.instalacion = instalacion;
		this.organizador = organizador;
		this.fechaInicio = fechaInicio;
		this.fechaFin = fechaFin;
		this.estado = estado != null ? estado : EstadoPartido.PROGRAMADO;
		this.plazasArbitralesSolicitadas = Math.max(1, plazasArbitralesSolicitadas);
	}

	public Long getId() {
		return id;
	}

	public Equipo getEquipoLocal() {
		return equipoLocal;
	}

	public Equipo getEquipoVisitante() {
		return equipoVisitante;
	}

	public Instalacion getInstalacion() {
		return instalacion;
	}

	public Usuario getOrganizador() {
		return organizador;
	}

	public LocalDateTime getFechaInicio() {
		return fechaInicio;
	}

	public LocalDateTime getFechaFin() {
		return fechaFin;
	}

	public EstadoPartido getEstado() {
		return estado;
	}

	public int getPlazasArbitralesSolicitadas() {
		return plazasArbitralesSolicitadas;
	}

	public void setFechaInicio(LocalDateTime fechaInicio) {
		this.fechaInicio = fechaInicio;
	}

	public void setFechaFin(LocalDateTime fechaFin) {
		this.fechaFin = fechaFin;
	}

	public void setEstado(EstadoPartido estado) {
		this.estado = estado;
	}

	public void setEquipoLocal(Equipo equipoLocal) {
		this.equipoLocal = equipoLocal;
	}

	public void setEquipoVisitante(Equipo equipoVisitante) {
		this.equipoVisitante = equipoVisitante;
	}

	public void setInstalacion(Instalacion instalacion) {
		this.instalacion = instalacion;
	}

	public void setOrganizador(Usuario organizador) {
		this.organizador = organizador;
	}

	public void setPlazasArbitralesSolicitadas(int plazasArbitralesSolicitadas) {
		this.plazasArbitralesSolicitadas = Math.max(1, plazasArbitralesSolicitadas);
	}

	public String getDeporte() {
		return deporte;
	}

	public void setDeporte(String deporte) {
		this.deporte = deporte;
	}

	public String getCompeticion() {
		return competicion;
	}

	public void setCompeticion(String competicion) {
		this.competicion = competicion;
	}

	public String getObservaciones() {
		return observaciones;
	}

	public void setObservaciones(String observaciones) {
		this.observaciones = observaciones;
	}
}
