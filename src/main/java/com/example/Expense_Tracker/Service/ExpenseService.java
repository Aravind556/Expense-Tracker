package com.example.Expense_Tracker.Service;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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


    public List<Expense> getAllExpensesForCurrentUser(){
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

    public Expense getExpenseById(Long id) {
        User user = getCurrentUser();
        return expenseRepo.findByIdAndUserUsername(id, user.getUsername())
            .orElseThrow(() -> new RuntimeException("Expense not found or does not belong to the user"));
    }

    //creating an expense
    public Expense addExpense(ExpenseDto expenseDto) {
        User user = getCurrentUser();

        Expense expense = Expense.builder()
            .amount(expenseDto.getAmount())
            .description(expenseDto.getDescription())
            .category(expenseDto.getCategory())
            .createdAt(expenseDto.getCreatedAt() != null ? expenseDto.getCreatedAt() : LocalDateTime.now())
            .user(user)
            .build();
        return expenseRepo.save(expense); 
    }

    public List<Expense> CategoryFilter(String category) {
        User user = getCurrentUser();
        return expenseRepo.findByUserUsernameAndCategoryOrderByCreatedAtDesc(user.getUsername(),Expense.Category.valueOf(category));
    }

    //updating an expense
    public Expense updateExpense(Long id,ExpenseDto expenseDto){
        User user = getCurrentUser();
        Expense expense = expenseRepo.findByIdAndUserUsername(id, user.getUsername())
            .orElseThrow(() -> new RuntimeException("Expense not found or does not belong to the user"));

        expense.setAmount(expenseDto.getAmount());
        expense.setDescription(expenseDto.getDescription());
        expense.setCategory(expenseDto.getCategory());
        // createdAt should not be updated
        return expenseRepo.save(expense);
    }

    public Double getTotalExpenses() {
        User user = getCurrentUser();
        return expenseRepo.getTotalExpenseByUsername(user.getUsername());
    }

    public Double getTotalExpensesByCategory(String category) {
        User user = getCurrentUser();
        return expenseRepo.getTotalExpenseByCategoryAndUsername(user.getUsername(), Expense.Category.valueOf(category));
    }

    public List<Expense> getExpenseByMonth(){
        User user = getCurrentUser();
        LocalDateTime startOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime endOfMonth = startOfMonth.plusMonths(1).minusSeconds(1);
        return expenseRepo.getExpensesInDateRange(user.getUsername(), startOfMonth, endOfMonth);
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

    // CRUD and basic expense operations only - dashboard functionality moved to DashboardService

    public Page<Expense> getExpensesByUser(String username, Pageable pageable) {
        // Since we don't have a native pagination method, we'll use the repository method
        // This is a simplified implementation - in production, you'd want proper pagination
        List<Expense> expenses = expenseRepo.findByUserUsernameOrderByCreatedAtDesc(username);
        
        // Convert List to Page manually (simplified)
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), expenses.size());
        List<Expense> pageContent = expenses.subList(start, end);
        
        return new org.springframework.data.domain.PageImpl<>(pageContent, pageable, expenses.size());
    }

    public Page<Expense> getFilteredExpenses(String username, String search, String category, 
                                           LocalDate fromDate, LocalDate toDate, Pageable pageable) {
        List<Expense> allExpenses = expenseRepo.findByUserUsernameOrderByCreatedAtDesc(username);
        
        // Apply filters
        List<Expense> filteredExpenses = allExpenses.stream()
            .filter(expense -> {
                // Search filter
                if (search != null && !search.isEmpty()) {
                    String searchLower = search.toLowerCase();
                    if (!expense.getDescription().toLowerCase().contains(searchLower)) {
                        return false;
                    }
                }
                
                // Category filter
                if (category != null && !category.isEmpty()) {
                    if (!expense.getCategory().name().equals(category)) {
                        return false;
                    }
                }
                
                // Date filters
                LocalDate expenseDate = expense.getCreatedAt().toLocalDate();
                if (fromDate != null && expenseDate.isBefore(fromDate)) {
                    return false;
                }
                if (toDate != null && expenseDate.isAfter(toDate)) {
                    return false;
                }
                
                return true;
            })
            .collect(Collectors.toList());
        
        // Convert to Page
        int start = (int) pageable.getOffset();
        int end = Math.min((start + pageable.getPageSize()), filteredExpenses.size());
        List<Expense> pageContent = filteredExpenses.subList(start, end);
        
        return new org.springframework.data.domain.PageImpl<>(pageContent, pageable, filteredExpenses.size());
    }

    public Optional<Expense> getExpenseById(Long id, String username) {
        return expenseRepo.findByIdAndUserUsername(id, username);
    }

}
