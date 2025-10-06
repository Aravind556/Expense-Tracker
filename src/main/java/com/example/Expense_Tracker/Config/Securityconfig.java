package com.example.Expense_Tracker.Config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import com.example.Expense_Tracker.Security.JwtAuthFilter;

import jakarta.servlet.http.HttpServletResponse;

@Configuration
@EnableWebSecurity
public class Securityconfig {

    
    private final Webconfig webconfig;
    
    private final JwtAuthFilter jwtAuthFilter;

    public Securityconfig(Webconfig webconfig, JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.webconfig = webconfig;
    }

    
    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception{
        return config.getAuthenticationManager();
    }

    @Bean
    public AuthenticationProvider authenticationProvider(){
        DaoAuthenticationProvider authProvider= new DaoAuthenticationProvider(webconfig.userDetailsService());
        authProvider.setPasswordEncoder(webconfig.passwordEncoder());
        return authProvider;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf-> csrf.disable())
            .authorizeHttpRequests(
                auth -> auth
                    // API authentication endpoints - no JWT required
                    .requestMatchers("/api/auth/**").permitAll()
                    // Static resources and common web assets - no authentication required
                    .requestMatchers("/css/**", "/js/**", "/images/**", "/static/**", "/favicon.ico", "/webjars/**").permitAll()
                    // Public pages - no authentication required
                    .requestMatchers("/", "/login", "/register", "/error", "/access-denied").permitAll()
                    // Protected pages - JWT authentication required
                    .requestMatchers("/dashboard", "/expenses", "/add-expense", "/profile", "/settings", "/reports").authenticated()
                    // API endpoints - JWT required
                    .requestMatchers("/api/**").authenticated()
                    // All other requests require authentication
                    .anyRequest().authenticated()
            )
            .sessionManagement(
                httpSecuritySessionManagementConfigurer -> httpSecuritySessionManagementConfigurer
                    .sessionCreationPolicy(org.springframework.security.config.http.SessionCreationPolicy.STATELESS)
            )
            // Disable form login - using JWT only
            .formLogin(form -> form.disable())
            .httpBasic(basic -> basic.disable())
            // Handle authentication failures
            .exceptionHandling(exceptions -> exceptions
                .authenticationEntryPoint((request, response, authException) -> {
                    // For AJAX/API requests, return 401
                    if (request.getRequestURI().startsWith("/api/")) {
                        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                        response.setContentType("application/json");
                        response.getWriter().write("{\"error\": \"Authentication required\"}");
                    } else {
                        // For web requests, redirect to login
                        response.sendRedirect("/login");
                    }
                })
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    // For AJAX/API requests, return 403
                    if (request.getRequestURI().startsWith("/api/")) {
                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        response.setContentType("application/json");
                        response.getWriter().write("{\"error\": \"Access denied\"}");
                    } else {
                        // For web requests, redirect to access denied page
                        response.sendRedirect("/access-denied");
                    }
                })
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class); 

        return http.build();

    }
}