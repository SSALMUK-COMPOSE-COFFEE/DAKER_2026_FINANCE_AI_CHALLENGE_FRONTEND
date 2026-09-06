\echo '=== 적재 건수 ==='
SELECT 'case_types' t, count(*) FROM case_types
UNION ALL SELECT 'questions', count(*) FROM questions
UNION ALL SELECT 'question_options', count(*) FROM question_options
UNION ALL SELECT 'type_rules', count(*) FROM type_rules
ORDER BY 1;

\echo '=== 차단 유형 (LLM 호출 금지) ==='
SELECT code, name, risk_level, out_of_scope FROM case_types
WHERE risk_level <> '없음' ORDER BY code;

\echo '=== 즉시 중단 선택지 ==='
SELECT question_code, option_key, left(label,30) AS label FROM question_options
WHERE stop_here ORDER BY question_code, ordinal;

\echo '=== 룰이 하나도 없는 유형 (판정 불가) ==='
SELECT c.code, c.name FROM case_types c
LEFT JOIN type_rules r ON r.case_type_id = c.id
WHERE r.id IS NULL ORDER BY c.code;

\echo '=== 유형별 준비 상태 ==='
SELECT * FROM v_pack_ready;
