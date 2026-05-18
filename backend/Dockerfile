FROM maven:3.9-eclipse-temurin-21 AS build

WORKDIR /app

COPY pom.xml .
RUN mvn -q -DskipTests dependency:go-offline

COPY src ./src
RUN mvn -q -DskipTests package

FROM eclipse-temurin:21-jre

WORKDIR /app

ENV SPRING_PROFILES_ACTIVE=dev
ENV SERVER_PORT=8080

EXPOSE 8080

COPY --from=build /app/target/*.jar app.jar

CMD ["sh", "-c", "java ${JAVA_OPTS:-} -jar app.jar --spring.profiles.active=${SPRING_PROFILES_ACTIVE:-dev} --server.port=${PORT:-${SERVER_PORT:-8080}}"]
