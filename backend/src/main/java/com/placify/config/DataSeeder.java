package com.placify.config;

import com.placify.entity.DsaTracker;
import com.placify.entity.DsaTracker.DifficultyLevel;
import com.placify.entity.SubjectProgress;
import com.placify.entity.SubjectProgress.Subject;
import com.placify.entity.User;
import com.placify.entity.User.Role;
import com.placify.repository.DsaTrackerRepository;
import com.placify.repository.SubjectProgressRepository;
import com.placify.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

@Configuration
public class DataSeeder {

    private static final List<DsaTopicSeed> DEFAULT_DSA_TOPICS = List.of(
        new DsaTopicSeed("Arrays", 100, DifficultyLevel.EASY),
        new DsaTopicSeed("Strings", 80, DifficultyLevel.EASY),
        new DsaTopicSeed("Hashing", 60, DifficultyLevel.MEDIUM),
        new DsaTopicSeed("Linked Lists", 70, DifficultyLevel.MEDIUM),
        new DsaTopicSeed("Stack & Queue", 60, DifficultyLevel.MEDIUM),
        new DsaTopicSeed("Binary Search", 60, DifficultyLevel.MEDIUM),
        new DsaTopicSeed("Trees & BST", 80, DifficultyLevel.MEDIUM),
        new DsaTopicSeed("Heaps", 50, DifficultyLevel.HARD),
        new DsaTopicSeed("Graphs", 100, DifficultyLevel.HARD),
        new DsaTopicSeed("Greedy", 60, DifficultyLevel.MEDIUM),
        new DsaTopicSeed("Dynamic Programming", 100, DifficultyLevel.HARD),
        new DsaTopicSeed("Tries", 40, DifficultyLevel.HARD),
        new DsaTopicSeed("Segment Trees & Advanced Topics", 30, DifficultyLevel.HARD)
    );

    record DsaTopicSeed(String name, int total, DifficultyLevel difficulty) {}

    @Bean
    public CommandLineRunner seedData(UserRepository userRepository,
                                      DsaTrackerRepository dsaTrackerRepository,
                                      SubjectProgressRepository subjectProgressRepository,
                                      PasswordEncoder passwordEncoder) {
        return args -> {
            try {
                // 1. Seed default admin
                if (!userRepository.existsByEmail("admin@placify.com")) {
                    User admin = new User("admin", "admin@placify.com",
                            passwordEncoder.encode("Admin@1234"), Role.ADMIN);
                    userRepository.save(admin);
                    System.out.println("Default admin user created: admin@placify.com / Admin@1234");
                }

                // 2. Seed DSA topics + Subject entries for every user
                List<User> allUsers = userRepository.findAll();
                for (User user : allUsers) {
                    seedDsaTopicsForUser(user.getId(), dsaTrackerRepository);
                    seedSubjectProgressForUser(user.getId(), subjectProgressRepository);
                }

                System.out.println("DataSeeder complete. Users seeded: " + allUsers.size());
            } catch (Exception e) {
                System.err.println("DataSeeder encountered an error (non-fatal): " + e.getMessage());
                e.printStackTrace();
            }
        };
    }

    private void seedDsaTopicsForUser(Long userId, DsaTrackerRepository repo) {
        for (DsaTopicSeed seed : DEFAULT_DSA_TOPICS) {
            if (!repo.existsByUserIdAndTopicName(userId, seed.name())) {
                DsaTracker topic = new DsaTracker();
                topic.setUserId(userId);
                topic.setTopicName(seed.name());
                topic.setTotalQuestions(seed.total());
                topic.setSolvedQuestions(0);
                topic.setProgressPercentage(0);
                topic.setDifficultyLevel(seed.difficulty());
                topic.setLastUpdatedDate(LocalDate.now());
                repo.save(topic);
            }
        }
    }

    private void seedSubjectProgressForUser(Long userId, SubjectProgressRepository repo) {
        Arrays.stream(Subject.values()).forEach(subject -> {
            if (!repo.existsByUserIdAndSubject(userId, subject)) {
                repo.save(new SubjectProgress(userId, subject));
            }
        });
    }
}
