package com.example.Expense_Tracker.Service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.example.Expense_Tracker.DTO.ExpenseDto;
import com.example.Expense_Tracker.Exception.UserNotFoundException;
import com.example.Expense_Tracker.Model.Expense;
import com.example.Expense_Tracker.Model.User;
import com.example.Expense_Tracker.Repository.ExpenseRepo;
import com.example.Expense_Tracker.Repository.UserRepo;

@Service
public class ExpenseService {

    private final ExpenseRepo expenseRepo;
    private final UserRepo userRepo;

    public ExpenseService(ExpenseRepo expenseRepo, UserRepo userRepo) {
        this.expenseRepo = expenseRepo;
        this.userRepo = userRepo;
    }


    List<Expense> getAllExpensesForCurrentUser(){
        String username = getCurrentUser().getUsername();
        return expenseRepo.findByUserUsernameOrderByCreatedAtDesc(username);
    }

    public User getCurrentUser(){
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        //checking if user exists
        User user = userRepo.findByUsername(username)
                .orElseThrow(() -> new UserNotFoundException(username));
        return user;
    }
    //creating an expense
    public Expense addExpense(ExpenseDto expenseDto) {
        User user = getCurrentUser();

        Expense expense = Expense.builder()
            .amount(expenseDto.getAmount())
            .description(expenseDto.getDescription())
            .category(expenseDto.getCategory())
            .user(user)
            .build();
        return expenseRepo.save(expense); 
    }

    public List<Expense> CategoryFilter(ExpenseDto expenseDto) {
        User user = getCurrentUser();
        return expenseRepo.findByUserUsernameAndCategoryOrderByCreatedAtDesc(user.getUsername(), expenseDto.getCategory());
    }

    public Double getTotalExpenses() {
        User user = getCurrentUser();
        return expenseRepo.getTotalExpenseByUsername(user.getUsername());
    }

    public Double getTotalExpensesByCategory(ExpenseDto expenseDto) {
        User user = getCurrentUser();
        return expenseRepo.getTotalExpenseByCategoryAndUsername(user.getUsername(), expenseDto.getCategory());
    }

    public List<Expense> getExpensesInWeek() {
        User user = getCurrentUser();
        return expenseRepo.getExpensesInDateWeek(user.getUsername(), java.time.LocalDateTime.now().minusDays(7));
    }

    public List<Expense> getExpensesInDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        User user = getCurrentUser();
        return expenseRepo.getExpensesInDateRange(user.getUsername(), startDate, endDate);
    }

    public void deleteExpense(Long expenseId){
        User user = getCurrentUser();
        Expense expense=expenseRepo.findByIdAndUserUsername(expenseId, user.getUsername())
            .orElseThrow(() -> new RuntimeException("Expense not found or does not belong to the user"));
        expenseRepo.delete(expense);
    }

}
