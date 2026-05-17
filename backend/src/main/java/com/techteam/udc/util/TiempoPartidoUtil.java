package com.techteam.udc.util;

import java.time.LocalDateTime;

import com.techteam.udc.models.Partido;

public final class TiempoPartidoUtil {

	private TiempoPartidoUtil() {
	}

	public static LocalDateTime finEfectivo(Partido p) {
		if (p.getFechaFin() != null) {
			return p.getFechaFin();
		}
		return p.getFechaInicio().plusHours(2);
	}

	public static boolean intervalosSeSolapan(
			LocalDateTime aInicio,
			LocalDateTime aFin,
			LocalDateTime bInicio,
			LocalDateTime bFin) {
		return aInicio.isBefore(bFin) && bInicio.isBefore(aFin);
	}

	public static boolean mismoDiaCalendario(LocalDateTime a, LocalDateTime b) {
		return a.toLocalDate().equals(b.toLocalDate());
	}
}
