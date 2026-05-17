package com.techteam.udc.controllers;

import java.util.Map;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public")
public class PublicController {

	@GetMapping("/demo")
	public Map<String, String> demo() {
		return Map.of(
				"app", "UDC Backend",
				"empresa", "U.D.C Tech Team",
				"lema", "Juntos por el deporte canario.");
	}
}
