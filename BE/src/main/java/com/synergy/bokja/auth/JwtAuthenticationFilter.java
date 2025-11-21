package com.synergy.bokja.auth;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtTokenProvider jwtTokenProvider;

    public JwtAuthenticationFilter(JwtTokenProvider jwtTokenProvider) {
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        String token = resolveToken(request);

        if (token != null && jwtTokenProvider.validateToken(token)) {
            Long uno = jwtTokenProvider.getUnoFromToken(token);

            System.out.println("Authenticated user ID: " + uno);

            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(uno, null, Collections.emptyList());
            SecurityContextHolder.getContext().setAuthentication(authentication);
        } else {
            System.out.println("Invalid or missing token");
        }

        filterChain.doFilter(request, response);
    }

    public String resolveToken(HttpServletRequest request) {
        String bearer = request.getHeader("Authorization");
        System.out.println("Original Authorization Header: " + bearer);
        if (bearer != null && bearer.startsWith("Bearer ")) {
            String token = bearer.substring(7);
            System.out.println("Extracted Token: " + token);
            return token;
        }
        return null;
    }
}

