package com.example.Expense_Tracker.Service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.Expense_Tracker.Model.User;
import com.example.Expense_Tracker.Repository.UserRepo;

@Service
public class UserService implements  UserDetailsService {

    private final UserRepo userRepo;
    private final PasswordEncoder passwordEncoder;


   public UserService(UserRepo userRepo, PasswordEncoder passwordEncoder) {
       this.userRepo = userRepo;
       this.passwordEncoder = passwordEncoder;
   }

   @Override
   public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException{

    User user1= userRepo.findByUsername(username)
    .orElseThrow(()-> new UsernameNotFoundException("User not found"));

    return (UserDetails) User.builder()
    .username(user1.getUsername())
    .password(user1.getPassword())
    .email(user1.getEmail())
    .build();
}

    public User register(User user){
        if(userRepo.existsByEmail(user.getEmail())){
            throw new IllegalArgumentException("Email already in use");
        }
        if(userRepo.existsByUsername(user.getUsername())){
            throw new IllegalArgumentException("Username already in use");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        return userRepo.save(user);
    }

}
