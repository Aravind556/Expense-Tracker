package com.example.Expense_Tracker.Config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.SecurityFilterChain;

import com.example.Expense_Tracker.Service.UserService;


@Configuration
@EnableWebSecurity
public class Securityconfig {

    
    public UserService userService;
    public Webconfig webconfig;

    public Securityconfig(UserService userService, Webconfig webconfig) {
        this.userService = userService;
        this.webconfig = webconfig;
    }

    @Bean
    public UserDetailsService userDetailsService(){
        return userService;
    }

    @Bean
    public AuthenticationProvider authenticationProvider(){
        DaoAuthenticationProvider authProvider= new DaoAuthenticationProvider(userService);
        authProvider.setPasswordEncoder(webconfig.passwordEncoder());
        return authProvider;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf-> csrf.disable())
            .authorizeHttpRequests(
                auth -> auth
                    .requestMatchers("/api/auth/**").permitAll()
                    .requestMatchers("/api/expenses/**").authenticated()
                    .anyRequest().authenticated()
            );
        
            
        
        
        
        return http.build();

    }
}
