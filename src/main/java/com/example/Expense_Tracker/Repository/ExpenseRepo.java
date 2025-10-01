package com.example.Expense_Tracker.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.example.Expense_Tracker.Model.Expense;
import com.example.Expense_Tracker.Model.Expense.Category;

@Repository
public interface ExpenseRepo extends JpaRepository<Expense, Long> {
    
    // Find all expenses for a specific user
    List<Expense> findByUserUsernameOrderByCreatedAtDesc(String username);
    Optional<Expense> findById(Long id);
    // Find expense by ID and user (for security - user can only access their own expenses)
    Optional<Expense> findByIdAndUserUsername(Long id, String username);
    // Find expenses by category for a specific user
    List<Expense> findByUserUsernameAndCategoryOrderByCreatedAtDesc(String username, Category category);
    
    // Custom query to get total expense amount for a user
    @Query("SELECT SUM(e.amount) FROM Expense e WHERE e.user.username = :username")
    Double getTotalExpenseByUsername(@Param("username") String username);
    
    //Getting expenses in date week for a user
    @Query("SELECT e FROM Expense e WHERE e.user.username = :username AND e.createdAt >= :days")
    List<Expense> getExpensesInDateWeek(@Param("username") String username, @Param("days") LocalDateTime days);

    

    //getting expenses in a date range for a user
    @Query("SELECT e FROM Expense e WHERE e.user.username = :username AND e.createdAt BETWEEN :startDate AND :endDate")
    List<Expense> getExpensesInDateRange(@Param("username") String username, @Param("startDate") LocalDateTime startDate, @Param("endDate") LocalDateTime endDate);


    // Custom query to get total expense amount by category for a user
    @Query("SELECT SUM(e.amount) FROM Expense e WHERE e.user.username = :username AND e.category = :category")
    Double getTotalExpenseByCategoryAndUsername(@Param("username") String username, @Param("category") Category category);
    
    // Count total expenses for a user
    long countByUserUsername(String username);
    
    // Delete all expenses for a user (useful for user deletion)
    //void deleteByUserUsername(String username);


    
}
