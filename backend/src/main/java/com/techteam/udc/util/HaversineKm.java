package com.techteam.udc.util;

import java.util.OptionalDouble;

// Distancia entre dos puntos en km (Haversine); vacio si falta algun lat/lon
public final class HaversineKm {

	private static final double RADIO_TIERRA_KM = 6371.0;

	private HaversineKm() {
	}

	public static OptionalDouble entre(Double lat1, Double lon1, Double lat2, Double lon2) {
		if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
			return OptionalDouble.empty();
		}
		double p1 = Math.toRadians(lat1);
		double p2 = Math.toRadians(lat2);
		double dp = Math.toRadians(lat2 - lat1);
		double dg = Math.toRadians(lon2 - lon1);
		double s1 = Math.sin(dp / 2);
		double s2 = Math.sin(dg / 2);
		double a = s1 * s1 + Math.cos(p1) * Math.cos(p2) * s2 * s2;
		double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return OptionalDouble.of(RADIO_TIERRA_KM * c);
	}
}
