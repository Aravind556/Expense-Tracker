package com.example.Expense_Tracker.Security;

import java.io.IOException;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import com.example.Expense_Tracker.Service.UserService;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter{

    private final JwtService jwtService;
    private final UserService userService;

    @Override
    protected void doFilterInternal(
        HttpServletRequest request, 
        HttpServletResponse response, 
        FilterChain filterChain) throws ServletException, IOException {

            final String header = response.getHeader("Authorization");
            if(header == null || !header.startsWith("Bearer ")){
                filterChain.doFilter(request, response);
                return;
            }
        try{
            final String jwt = header.substring(7);
            final String username = jwtService.extractUsername(jwt);
            if(username !=null && SecurityContextHolder.getContext().getAuthentication() == null){
                UserDetails user = userService.loadUserByUsername(username);
                if(jwtService.isTokenValid(jwt, user)){
                    //Set the authentication in the context
                    //This token is required by spring security to authenticate the user
                    UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                        user,
                        null,
                        user.getAuthorities()
                    );

                    //setting details in the authtoken
                    authToken.setDetails(
                        new WebAuthenticationDetailsSource().buildDetails(request)
                    );
                    //setting the authentication in the context
                    //So now the user is authenticated
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                }
                //sending the request to the next filter in the chain
                filterChain.doFilter(request, response);
                
            }
        }
        catch(Exception e){
            e.printStackTrace();
        }
    }

}
