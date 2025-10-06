package com.example.Expense_Tracker.Security;

import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.function.Function;

import javax.crypto.SecretKey;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private  String key;
    @Value("${jwt.expiration}")
    private Long expiration;

    private final ConcurrentHashMap<String,Long> blacklisted = new ConcurrentHashMap<>();

    //Extracts username from the token
    public String extractUsername(String token){
        return extractClaim(token,Claims::getSubject);
    }

    //Single claim extraction
    private <T> T extractClaim(String token , Function<Claims,T> claimsResolver) {
        final Claims claims = extractallClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractallClaims(String token){
        return Jwts
            .parserBuilder()
            .setSigningKey(getSignInKey())
            .build()
            .parseClaimsJws(token)
            .getBody();
                   
    } 
    //For generating token only with the subject(either username or email)
    public String generateToken(UserDetails userDetails){
        return generateToken(new HashMap<>(),userDetails);
    }

    public void blackListToken(String token){
        Date expirationDate = extractExpiration(token);
        blacklisted.put(token,expirationDate.getTime());
    }

    public boolean isTokenBlacklisted(String token){
        if(token == null) return false; // null token is not blacklisted
        
        // Check if token exists in blacklist
        Long expirationTime = blacklisted.get(token);
        if(expirationTime == null) {
            return false; // Token not in blacklist
        }
        
        // Token is in blacklist, check if it's expired
        if(expirationTime < System.currentTimeMillis()){
            // Token expired, remove from blacklist
            blacklisted.remove(token);
            return false; 
        }
        
        // Token is in blacklist and not expired
        return true;
    }

    //For generating token with claims 
    public String generateToken(Map<String,Object> extraClaims, UserDetails userDetails){
        return Jwts
            .builder()
            .setClaims(extraClaims)
            .setSubject(userDetails.getUsername())
            .setIssuedAt(new Date(System.currentTimeMillis()))
            .setExpiration(new Date(expiration+ System.currentTimeMillis()))
            .signWith(getSignInKey())
            .compact();
    }

    //checking if token is valid
    public boolean isTokenValid(String token, UserDetails userDetails){
        final String username = extractUsername(token);
        return (username.equals(userDetails.getUsername()) &&!isTokenExpired(token));
    }

    //Checking if token is expired
    private boolean isTokenExpired(String token){
        return extractExpiration(token).before(new Date());
    }

    //Extracting expiration date from token
    //Need to switch to Instant for better time handling and readablility 
    private Date extractExpiration(String token) {
        return extractClaim(token,Claims::getExpiration);
    }

    private SecretKey getSignInKey() {
        byte[] keyBytes=Decoders.BASE64.decode(key);
        return Keys.hmacShaKeyFor(keyBytes);
    }
    
}
