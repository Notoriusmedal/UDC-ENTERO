package com.techteam.udc;

import static org.hamcrest.Matchers.blankOrNullString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("dev")
class UdcApplicationTests {

	@Autowired
	private MockMvc mockMvc;

	@Test
	void loginDevAdminDevuelveJwt() throws Exception {
		mockMvc.perform(post("/api/auth/login")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{"username":"admin","password":"admin"}
						"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.accessToken").value(not(blankOrNullString())));
	}

	@Test
	void registroEspectadorDevuelveJwt() throws Exception {
		mockMvc.perform(post("/api/auth/register")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
						  "username":"nuevo-espectador",
						  "password":"1234",
						  "nombre":"Nuevo",
						  "apellidos":"Espectador",
						  "correo":"nuevo.espectador@udc.dev",
						  "documentoIdentidad":"REG-000",
						  "telefono":"600000000",
						  "rol":"ESPECTADOR"
						}
						"""))
				.andExpect(status().isOk())
				.andExpect(jsonPath("$.accessToken").value(not(blankOrNullString())))
				.andExpect(jsonPath("$.estado").value("ACTIVO"))
				.andExpect(jsonPath("$.rol").value("ESPECTADOR"));
	}

	@Test
	void registroOrganizadorQuedaPendiente() throws Exception {
		mockMvc.perform(post("/api/auth/register")
				.contentType(MediaType.APPLICATION_JSON)
				.content("""
						{
						  "username":"nuevo-organizador",
						  "password":"1234",
						  "nombre":"Nuevo",
						  "apellidos":"Organizador",
						  "correo":"nuevo.organizador@udc.dev",
						  "documentoIdentidad":"REG-001",
						  "telefono":"600000001",
						  "rol":"ORGANIZADOR"
						}
						"""))
				.andExpect(status().isAccepted())
				.andExpect(jsonPath("$.accessToken").value(blankOrNullString()))
				.andExpect(jsonPath("$.estado").value("PENDIENTE_APROBACION"))
				.andExpect(jsonPath("$.rol").value("ORGANIZADOR"));
	}
}
