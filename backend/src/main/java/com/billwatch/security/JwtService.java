package com.billwatch.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String secret;

    @Value("${jwt.expiracao-minutos}")
    private long expiracaoMinutos;

    private SecretKey secretKey(){
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(secret));
    }

    public String gerarToken(String email, String nome) {
        long agora = System.currentTimeMillis();
        return Jwts.builder()
                .subject(email)
                .claim("nome", nome)
                .issuedAt(new Date(agora))
                .expiration(new Date(agora + expiracaoMinutos * 60_000))
                .signWith(secretKey())
                .compact();
    }

    public String extrairEmail(String token){
        return extrairClaims(token).getSubject();
    }

    public Claims extrairClaims(String token) {
        return Jwts.parser()
                .verifyWith(secretKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
}
