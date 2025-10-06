package com.example.Expense_Tracker.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.example.Expense_Tracker.Model.Expense;
import com.example.Expense_Tracker.Repository.ExpenseRepo;

@Service
public class DashboardService {

    private final ExpenseRepo expenseRepo;

    public DashboardService(ExpenseRepo expenseRepo) {
        this.expenseRepo = expenseRepo;
    }

    /**
     * Get comprehensive dashboard statistics for a user
     * @param username the username to get statistics for
     * @return Map containing totalExpenses, monthlyExpenses, totalTransactions, and averageTransaction
     */
    public Map<String, Object> getDashboardStatistics(String username) {
        Map<String, Object> stats = new HashMap<>();
        
        Double totalExpenses = expenseRepo.getTotalExpenseByUsername(username);
        stats.put("totalExpenses", totalExpenses != null ? BigDecimal.valueOf(totalExpenses) : BigDecimal.ZERO);
        
        // Get current month expenses
        LocalDateTime startOfMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();
        LocalDateTime endOfMonth = LocalDate.now().withDayOfMonth(LocalDate.now().lengthOfMonth()).atTime(23, 59, 59);
        List<Expense> monthlyExpenses = expenseRepo.getExpensesInDateRange(username, startOfMonth, endOfMonth);
        BigDecimal monthlyTotal = monthlyExpenses.stream()
            .map(Expense::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        stats.put("monthlyExpenses", monthlyTotal);
        
        // Total transactions count
        List<Expense> allExpenses = expenseRepo.findByUserUsernameOrderByCreatedAtDesc(username);
        stats.put("totalTransactions", allExpenses.size());
        
        // Average transaction
        BigDecimal averageTransaction = BigDecimal.ZERO;
        if (!allExpenses.isEmpty()) {
            BigDecimal total = allExpenses.stream()
                .map(Expense::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
            averageTransaction = total.divide(BigDecimal.valueOf(allExpenses.size()), 2, RoundingMode.HALF_UP);
        }
        stats.put("averageTransaction", averageTransaction);
        
        return stats;
    }

    /**
     * Get category breakdown with percentages for dashboard charts
     * @param username the username to get category breakdown for
     * @return List of maps containing category data with name, amount, and percentage
     */
    public List<Map<String, Object>> getCategoryBreakdown(String username) {
        List<Expense> expenses = expenseRepo.findByUserUsernameOrderByCreatedAtDesc(username);
        BigDecimal total = expenses.stream()
            .map(Expense::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
        
        if (total.equals(BigDecimal.ZERO)) {
            return List.of();
        }
        
        return expenses.stream()
            .collect(Collectors.groupingBy(Expense::getCategory))
            .entrySet().stream()
            .map(entry -> {
                BigDecimal categoryTotal = entry.getValue().stream()
                    .map(Expense::getAmount)
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
                
                Map<String, Object> categoryData = new HashMap<>();
                categoryData.put("name", entry.getKey().getDisplayName());
                categoryData.put("category", entry.getKey().name());
                categoryData.put("amount", categoryTotal);
                categoryData.put("total", total);
                categoryData.put("percentage", categoryTotal.multiply(BigDecimal.valueOf(100))
                    .divide(total, 1, RoundingMode.HALF_UP).doubleValue());
                
                return categoryData;
            })
            .collect(Collectors.toList());
    }

    /**
     * Get total expenses for a specific month
     * @param username the username to get expenses for
     * @param yearMonth the year and month to get expenses for
     * @return BigDecimal representing total expenses for the month
     */
    public BigDecimal getMonthlyExpenses(String username, YearMonth yearMonth) {
        LocalDateTime startOfMonth = yearMonth.atDay(1).atStartOfDay();
        LocalDateTime endOfMonth = yearMonth.atEndOfMonth().atTime(23, 59, 59);
        
        List<Expense> monthlyExpenses = expenseRepo.getExpensesInDateRange(username, startOfMonth, endOfMonth);
        return monthlyExpenses.stream()
            .map(Expense::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /**
     * Get recent expenses for dashboard display (limited to 5)
     * @param username the username to get expenses for
     * @return List of the 5 most recent expenses
     */
    public List<Expense> getRecentExpenses(String username) {
        return expenseRepo.findByUserUsernameOrderByCreatedAtDesc(username)
            .stream()
            .limit(5)
            .collect(Collectors.toList());
    }
}