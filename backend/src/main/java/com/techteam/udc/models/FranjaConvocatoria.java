package com.techteam.udc.models;

import java.time.LocalDateTime;

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
@Table(name = "franja_convocatoria")
public class FranjaConvocatoria {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(optional = false, fetch = FetchType.LAZY)
	@JoinColumn(name = "arbitro_id")
	private Usuario arbitro;

	@Column(nullable = false)
	private LocalDateTime inicio;

	@Column(nullable = false)
	private LocalDateTime fin;

	protected FranjaConvocatoria() {
	}

	public FranjaConvocatoria(Usuario arbitro, LocalDateTime inicio, LocalDateTime fin) {
		this.arbitro = arbitro;
		this.inicio = inicio;
		this.fin = fin;
	}

	public Long getId() {
		return id;
	}

	public Usuario getArbitro() {
		return arbitro;
	}

	public LocalDateTime getInicio() {
		return inicio;
	}

	public LocalDateTime getFin() {
		return fin;
	}

	public void setInicio(LocalDateTime inicio) {
		this.inicio = inicio;
	}

	public void setFin(LocalDateTime fin) {
		this.fin = fin;
	}
}
