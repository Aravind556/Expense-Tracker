package com.example.Expense_Tracker.Security;

import java.io.IOException;

import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter{

    private final JwtService jwtService;
    private final UserDetailsService userService;

    @Override
    protected void doFilterInternal(
        HttpServletRequest request, 
        HttpServletResponse response, 
        FilterChain filterChain) throws ServletException, IOException {

            // Try to get JWT from Authorization header first (for API calls)
            String jwt = null;
            final String header = request.getHeader("Authorization");
            if(header != null && header.startsWith("Bearer ")){
                jwt = header.substring(7);
            } else {
                // Try to get JWT from cookie (for web page requests)
                if(request.getCookies() != null) {
                    for(var cookie : request.getCookies()) {
                        if("authToken".equals(cookie.getName())) {
                            jwt = cookie.getValue();
                            break;
                        }
                    }
                }
            }
            
            if(jwt == null) {
                filterChain.doFilter(request, response);
                return;
            }
            
            // Check if token is blacklisted first
            if(jwtService.isTokenBlacklisted(jwt)) {
                // Clear the cookie and redirect to login
                clearAuthCookie(response);
                response.sendRedirect("/login");
                return;
            }
            
        try{
            final String username = jwtService.extractUsername(jwt);
            if(username !=null && SecurityContextHolder.getContext().getAuthentication() == null){
                try {
                    UserDetails user = this.userService.loadUserByUsername(username);
                    if(jwtService.isTokenValid(jwt, user)){
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
                } catch (Exception userEx) {
                    // User not found or authentication failed - clear cookie and continue
                    clearAuthCookie(response);
                    System.err.println("Authentication failed for user: " + username + " - " + userEx.getMessage());
                }
                //sending the request to the next filter in the chain
                filterChain.doFilter(request, response);
                
            }
        }
        catch(Exception e){
            e.printStackTrace();
        }
    }

    private void clearAuthCookie(HttpServletResponse response) {
        // Create a cookie with the same name but expired
        jakarta.servlet.http.Cookie clearCookie = new jakarta.servlet.http.Cookie("authToken", "");
        clearCookie.setPath("/");
        clearCookie.setMaxAge(0); // Expire immediately
        clearCookie.setHttpOnly(true);
        response.addCookie(clearCookie);
    }

}
