package com.synergy.bokja.entity;

import jakarta.persistence.*;
import lombok.*;

@Getter @Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "time_table")
public class TimeEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long tno;

    @Column(nullable = false, length = 20)
    private String type;

    @Column(nullable = false, length = 10)
    private String time;
}
