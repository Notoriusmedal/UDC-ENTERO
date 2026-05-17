package com.techteam.udc.models;

import java.time.Instant;

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
@Table(name = "notificacion")
public class Notificacion {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(optional = false, fetch = FetchType.LAZY)
	@JoinColumn(name = "destinatario_id")
	private Usuario destinatario;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 48)
	private TipoNotificacion tipo;

	@Column(nullable = false, length = 160)
	private String titulo;

	@Column(nullable = false, length = 1000)
	private String mensaje;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "partido_id")
	private Partido partido;

	@Column(nullable = false)
	private boolean leida;

	@Column(nullable = false)
	private Instant creadoEn = Instant.now();

	protected Notificacion() {
	}

	public Notificacion(
			Usuario destinatario,
			TipoNotificacion tipo,
			String titulo,
			String mensaje,
			Partido partido) {
		this.destinatario = destinatario;
		this.tipo = tipo;
		this.titulo = titulo;
		this.mensaje = mensaje;
		this.partido = partido;
		this.leida = false;
	}

	public Long getId() {
		return id;
	}

	public Usuario getDestinatario() {
		return destinatario;
	}

	public TipoNotificacion getTipo() {
		return tipo;
	}

	public String getTitulo() {
		return titulo;
	}

	public String getMensaje() {
		return mensaje;
	}

	public Partido getPartido() {
		return partido;
	}

	public boolean isLeida() {
		return leida;
	}

	public Instant getCreadoEn() {
		return creadoEn;
	}

	public void setLeida(boolean leida) {
		this.leida = leida;
	}
}
