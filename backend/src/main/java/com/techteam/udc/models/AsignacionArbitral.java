package com.techteam.udc.models;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

@Entity
@Table(name = "asignacion_arbitral")
public class AsignacionArbitral {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(optional = false, fetch = FetchType.LAZY)
	@JoinColumn(name = "partido_id")
	private Partido partido;

	@ManyToOne(optional = false, fetch = FetchType.LAZY)
	@JoinColumn(name = "arbitro_id")
	private Usuario arbitro;

	@Column(nullable = false, length = 80)
	private String posicionEnCampo;

	@ManyToOne(optional = false, fetch = FetchType.LAZY)
	@JoinColumn(name = "asignado_por_id")
	private Usuario asignadoPor;

	@Column(nullable = false)
	private Instant creadoEn = Instant.now();

	@Column(nullable = false)
	private boolean revocada;

	@Column(nullable = false, length = 40)
	private String estado = "PENDIENTE";

	@Column(length = 1000)
	private String observaciones;

	protected AsignacionArbitral() {
	}

	public AsignacionArbitral(
			Partido partido,
			Usuario arbitro,
			String posicionEnCampo,
			Usuario asignadoPor) {
		this.partido = partido;
		this.arbitro = arbitro;
		this.posicionEnCampo = posicionEnCampo;
		this.asignadoPor = asignadoPor;
		this.revocada = false;
	}

	public Long getId() {
		return id;
	}

	public Partido getPartido() {
		return partido;
	}

	public Usuario getArbitro() {
		return arbitro;
	}

	public String getPosicionEnCampo() {
		return posicionEnCampo;
	}

	public Usuario getAsignadoPor() {
		return asignadoPor;
	}

	public Instant getCreadoEn() {
		return creadoEn;
	}

	public boolean isRevocada() {
		return revocada;
	}

	public void setRevocada(boolean revocada) {
		this.revocada = revocada;
	}

	public String getEstado() {
		return estado;
	}

	public void setEstado(String estado) {
		this.estado = estado;
	}

	public String getObservaciones() {
		return observaciones;
	}

	public void setObservaciones(String observaciones) {
		this.observaciones = observaciones;
	}
}
